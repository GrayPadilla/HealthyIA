import { registrarUsuarioLogic, iniciarSesionLogic } from '../Salud/Controlador/C-Registrar-login/register-login.js';
import { jest } from '@jest/globals';

// Mocks de Firestore
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockGetDocs = jest.fn();
const mockDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockServerTimestamp = jest.fn();

const firestoreMocks = {
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  getDocs: mockGetDocs,
  doc: mockDoc,
  setDoc: mockSetDoc,
  serverTimestamp: mockServerTimestamp
};

describe('🧪 Registro y Login (lógica)', () => {
  const db = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- REGISTRO ----------
  test('CP-01: Registro falla si faltan campos obligatorios', async () => {
    const datos = { email: '', password: '', confirmPassword: '', edad: '', genero: '', altura: '', peso: '' };
    const res = await registrarUsuarioLogic(datos, db, firestoreMocks);
    expect(res).toEqual({ ok: false, mensaje: "Todos los campos son obligatorios" });
  });

  test('CP-02: Registro exitoso', async () => {
    mockSetDoc.mockResolvedValueOnce(true);
    const datos = {
      email: 'nuevo@gmail.com',
      password: 'Segura123',
      confirmPassword: 'Segura123',
      edad: '25', genero: 'Masculino', altura: '170', peso: '70'
    };
    const res = await registrarUsuarioLogic(datos, db, firestoreMocks);
    expect(res.ok).toBe(true);
    expect(res.mensaje).toMatch(/Registro exitoso/i);
  });

  test('CP-03: Contraseñas no coinciden', async () => {
    const datos = {
      email: 'test@gmail.com',
      password: '1234',
      confirmPassword: '5678',
      edad: '25', genero: 'Masculino', altura: '180', peso: '75'
    };
    const res = await registrarUsuarioLogic(datos, db, firestoreMocks);
    expect(res.ok).toBe(false);
    expect(res.mensaje).toMatch(/contraseñas no coinciden/i);
  });

  // ---------- LOGIN ----------
  test('CP-04: Login falla si faltan campos', async () => {
    const res = await iniciarSesionLogic('', '', db, firestoreMocks);
    expect(res.ok).toBe(false);
    expect(res.mensaje).toMatch(/obligatorios/i);
  });

  test('CP-05: Usuario no encontrado', async () => {
    mockGetDocs.mockResolvedValueOnce({ empty: true });
    const res = await iniciarSesionLogic('usuario@ejemplo.com', '1234', db, firestoreMocks);
    expect(res.ok).toBe(false);
    expect(res.mensaje).toMatch(/no encontrado/i);
  });

  test('CP-06: Inicio de sesión exitoso', async () => {
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => ({ rol: 'usuario' }) }]
    });
    const res = await iniciarSesionLogic('usuario@ejemplo.com', '1234', db, firestoreMocks);
    expect(res.ok).toBe(true);
    expect(res.mensaje).toMatch(/exitoso/i);
  });
});
