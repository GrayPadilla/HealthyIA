/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

import {
    safeNum,
    formatDateISO,
    waitForFirebase,
    uploadImageFile,
    deleteImageByPath,
    cargarMenusLogic,
    agregarMenuEjemploLogic,
    guardarMenuLogic,
    eliminarMenuLogic,
    registrarInventarioLogic,
    cargarInventarioLogic,
    registrarDesperdicioLogic,
    cargarDesperdiciosLogic,
    cargarUsuariosLogic,
    loadDashboardStats,
    mostrarNotificacionLogic,
    attachTableActionListenersLogic
} from "../Administrador/admin/adminController.logic.js"; // <-- Ajusta ruta si hace falta

describe("Admin controller logic - CP-13..CP-41", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "warn").mockImplementation(() => {}); // silencia warnings en tests
    });

    afterEach(() => {
        console.warn.mockRestore();
    });

    // ===== Storage mocks =====
    const mockRef = jest.fn((storage, path) => ({ __ref: path }));
    const mockUploadBytes = jest.fn(async (ref, file) => ({ bytesTransferred: file?.size || 0 }));
    const mockGetDownloadURL = jest.fn(async (ref) => `https://cdn.example/${ref.__ref}`);
    const mockDeleteObject = jest.fn(async (ref) => true);
    const storage = {}; // placeholder for real storage instance
    const storageFns = { ref: mockRef, uploadBytes: mockUploadBytes, getDownloadURL: mockGetDownloadURL, deleteObject: mockDeleteObject };

    // ===== Firestore mocks =====
    const mockCollection = jest.fn((dbArg, name) => ({ __collection: name }));
    const mockDoc = jest.fn((dbArg, col, id) => ({ __doc: `${col}/${id}`, id }));
    const mockAddDoc = jest.fn(async (colRef, data) => ({ id: "doc-mock-id", data }));
    const mockGetDocs = jest.fn(async (refOrQuery) => ({ empty: true, size: 0, docs: [], forEach: () => {} }));
    const mockUpdateDoc = jest.fn(async (ref, data) => true);
    const mockDeleteDoc = jest.fn(async (ref) => true);
    const mockQuery = jest.fn((ref, ...args) => ({ __query: ref, args }));
    const mockOrderBy = jest.fn((field, dir) => ({ __orderBy: [field, dir] }));

    const firestoreFns = {
        collection: mockCollection,
        doc: mockDoc,
        addDoc: mockAddDoc,
        getDocs: mockGetDocs,
        updateDoc: mockUpdateDoc,
        deleteDoc: mockDeleteDoc,
        query: mockQuery,
        orderBy: mockOrderBy
    };

    const db = {}; // placeholder

    // -----------------------
    // CP-13: uploadImageFile - Subida exitosa
    // -----------------------
    test("CP-13: uploadImageFile - subida exitosa devuelve url y path", async () => {
        const fakeFile = { name: "pic.png", size: 1234 };
        const res = await uploadImageFile(storage, storageFns, fakeFile);
        expect(mockRef).toHaveBeenCalled();
        expect(mockUploadBytes).toHaveBeenCalled();
        expect(mockGetDownloadURL).toHaveBeenCalled();
        expect(res).toHaveProperty("url");
        expect(res).toHaveProperty("path");
        expect(res.url).toMatch(/^https:\/\/cdn\.example\//);
    });

    // -----------------------
    // CP-14: uploadImageFile - archivo null/undefined
    // -----------------------
    test("CP-14: uploadImageFile - file null devuelve null", async () => {
        const res = await uploadImageFile(storage, storageFns, null);
        expect(res).toBeNull();
    });

    // -----------------------
    // CP-15: uploadImageFile - error en uploadBytes
    // -----------------------
    test("CP-15: uploadImageFile - uploadBytes lanza error y se propaga", async () => {
        const fakeFile = { name: "err.png", size: 10 };
        mockUploadBytes.mockRejectedValueOnce(new Error("upload failed"));
        await expect(uploadImageFile(storage, storageFns, fakeFile)).rejects.toThrow(/upload failed/);
    });

    // -----------------------
    // CP-16: deleteImageByPath - storage null -> manejo seguro
    // -----------------------
    test("CP-16: deleteImageByPath - storage null no explota y retorna not initialized", async () => {
        const result = await deleteImageByPath(null, storageFns, "menus/path.png");
        // según la implementación, retorna { ok: false, message: "storage not initialized" }
        expect(result).toBeDefined();
        expect(result.ok).toBe(false);
    });

    // -----------------------
    // CP-17: deleteImageByPath - eliminación exitosa
    // -----------------------
    test("CP-17: deleteImageByPath - deleteObject llamado con path", async () => {
        const result = await deleteImageByPath(storage, storageFns, "menus/to-delete.png");
        expect(mockRef).toHaveBeenCalledWith(storage, "menus/to-delete.png");
        expect(mockDeleteObject).toHaveBeenCalled();
        expect(result.ok).toBe(true);
    });

    // -----------------------
    // CP-18: deleteImageByPath - error al eliminar
    // -----------------------
    test("CP-18: deleteImageByPath - deleteObject fallo manejado", async () => {
        mockDeleteObject.mockRejectedValueOnce(new Error("delete fail"));
        const result = await deleteImageByPath(storage, storageFns, "menus/bad.png");
        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toMatch(/delete fail/);
    });

    // -----------------------
    // CP-19: cargarMenusLogic - carga con resultados (getDocs devuelve docs array)
    // -----------------------
    test("CP-19: cargarMenusLogic - devuelve array con docs (forEach)", async () => {
        const fakeSnap = {
        empty: false,
        size: 2,
        docs: [
            { id: "m1", data: () => ({ titulo: "A" }) },
            { id: "m2", data: () => ({ titulo: "B" }) }
        ],
        forEach(cb) { this.docs.forEach(cb); }
        };
        mockGetDocs.mockResolvedValueOnce(fakeSnap);
        const menus = await cargarMenusLogic(db, { collection: mockCollection, query: mockQuery, orderBy: mockOrderBy, getDocs: mockGetDocs });
        expect(Array.isArray(menus)).toBe(true);
        expect(menus.length).toBe(2);
        expect(menus[0].id).toBe("m1");
    });

    // -----------------------
    // CP-20: cargarMenusLogic - vacío
    // -----------------------
    test("CP-20: cargarMenusLogic - vacío devuelve []", async () => {
        mockGetDocs.mockResolvedValueOnce({ empty: true, size: 0, docs: [], forEach: () => {} });
        const menus = await cargarMenusLogic(db, { collection: mockCollection, query: mockQuery, orderBy: mockOrderBy, getDocs: mockGetDocs });
        expect(Array.isArray(menus)).toBe(true);
        expect(menus.length).toBe(0);
    });

    // -----------------------
    // CP-21: agregarMenuEjemploLogic - crea y devuelve id
    // -----------------------
    test("CP-21: agregarMenuEjemploLogic - addDoc devuelve id", async () => {
        mockAddDoc.mockResolvedValueOnce({ id: "new-menu-id" });
        const id = await agregarMenuEjemploLogic(db, { collection: mockCollection, addDoc: mockAddDoc });
        expect(mockCollection).toHaveBeenCalledWith(db, "menus");
        expect(mockAddDoc).toHaveBeenCalled();
        expect(id).toBe("new-menu-id");
    });

    // -----------------------
    // CP-22: guardarMenuLogic - crear sin archivo
    // -----------------------
    test("CP-22: guardarMenuLogic - crear menu sin archivo (addDoc)", async () => {
        mockAddDoc.mockResolvedValueOnce({ id: "m1" });
        const data = { titulo: "T", precio: "15", categorias: [] };
        const res = await guardarMenuLogic(db, { collection: mockCollection, addDoc: mockAddDoc }, null, {}, data, null);
        expect(res.ok).toBe(true);
        expect(res.created).toBe(true);
        expect(res.id).toBe("m1");
    });

    // -----------------------
    // CP-23: guardarMenuLogic - actualizar menú (updateDoc)
    // -----------------------
    test("CP-23: guardarMenuLogic - updateDoc llamado para id dado", async () => {
        mockUpdateDoc.mockResolvedValueOnce(true);
        const data = { titulo: "T2", precio: "20" };
        const res = await guardarMenuLogic(db, { collection: mockCollection, doc: mockDoc, updateDoc: mockUpdateDoc }, null, {}, data, "existing-id");
        expect(res.ok).toBe(true);
        expect(res.updated).toBe(true);
    });

    // -----------------------
    // CP-24: guardarMenuLogic - crear con imagen (upload + addDoc)
    // -----------------------
    test("CP-24: guardarMenuLogic - subir imagen y crear (uploadBytes + getDownloadURL + addDoc)", async () => {
        mockUploadBytes.mockResolvedValueOnce({ bytesTransferred: 10 });
        mockGetDownloadURL.mockResolvedValueOnce("https://cdn.example/menus/p.png");
        mockAddDoc.mockResolvedValueOnce({ id: "m-with-img" });

        const file = { name: "p.png", size: 10 };
        const data = { titulo: "WithImg", precio: "9.5", file };

        const res = await guardarMenuLogic(db,
        { collection: mockCollection, addDoc: mockAddDoc },
        storage, { ref: mockRef, uploadBytes: mockUploadBytes, getDownloadURL: mockGetDownloadURL }, data, null);

        expect(mockUploadBytes).toHaveBeenCalled();
        expect(mockGetDownloadURL).toHaveBeenCalled();
        expect(res.ok).toBe(true);
        expect(res.created).toBe(true);
        expect(res.id).toBe("m-with-img");
    });

    // -----------------------
    // CP-25: guardarMenuLogic - error interno (addDoc reject)
    // -----------------------
    test("CP-25: guardarMenuLogic - addDoc rechaza y captura error", async () => {
        mockAddDoc.mockRejectedValueOnce(new Error("DB fail"));
        const data = { titulo: "Bad", precio: "1" };
        const res = await guardarMenuLogic(db, { collection: mockCollection, addDoc: mockAddDoc }, null, {}, data, null);
        expect(res.ok).toBe(false);
        expect(res.message).toMatch(/DB fail/);
    });

    // -----------------------
    // CP-26: eliminarMenuLogic - elimina doc y elimina imagen
    // -----------------------
    test("CP-26: eliminarMenuLogic - deleteDoc y deleteImageByPath llamado", async () => {
        mockDeleteDoc.mockResolvedValueOnce(true);
        mockDeleteObject.mockResolvedValueOnce(true);
        const res = await eliminarMenuLogic(db, { doc: mockDoc, deleteDoc: mockDeleteDoc }, storage, { ref: mockRef, deleteObject: mockDeleteObject }, "id-1", "menus/p.png");
        expect(mockDeleteDoc).toHaveBeenCalled();
        expect(mockDeleteObject).toHaveBeenCalled();
        expect(res.ok).toBe(true);
    });

    // -----------------------
    // CP-27: eliminarMenuLogic - error en deleteDoc
    // -----------------------
    test("CP-27: eliminarMenuLogic - deleteDoc falla y captura", async () => {
        mockDeleteDoc.mockRejectedValueOnce(new Error("del fail"));
        const res = await eliminarMenuLogic(db, { doc: mockDoc, deleteDoc: mockDeleteDoc }, storage, { ref: mockRef, deleteObject: mockDeleteObject }, "id-err", null);
        expect(res.ok).toBe(false);
        expect(res.error).toBeInstanceOf(Error);
    });

    // -----------------------
    // CP-28: registrarInventarioLogic - crear nuevo
    // -----------------------
    test("CP-25: registrarInventarioLogic - crear inventario", async () => {
        mockAddDoc.mockResolvedValueOnce({ id: "inv1" });
        const data = { nombre: "Tomate", categoria: "Verdura", stock_actual: "10", stock_minimo: "2" };
        const res = await registrarInventarioLogic(db, { collection: mockCollection, addDoc: mockAddDoc }, data, null);
        expect(res.ok).toBe(true);
        expect(res.created).toBe(true);
        expect(mockAddDoc).toHaveBeenCalled();
    });

    // -----------------------
    // CP-29: registrarInventarioLogic - actualizar existente
    // -----------------------
    test("CP-26: registrarInventarioLogic - actualizar inventario", async () => {
        mockUpdateDoc.mockResolvedValueOnce(true);
        const data = { nombre: "Tom", categoria: "V", stock_actual: "5", stock_minimo: "1" };

        // PASAMOS collection además de doc/updateDoc porque la función valida collection al inicio
        const firestoreForUpdate = {
            collection: mockCollection,
            doc: mockDoc,
            updateDoc: mockUpdateDoc
        };

        const res = await registrarInventarioLogic(db, firestoreForUpdate, data, "id-inv");
        expect(res.ok).toBe(true);
        expect(res.updated).toBe(true);
        expect(mockUpdateDoc).toHaveBeenCalled();
    });

    // -----------------------
    // CP-30: cargarInventarioLogic - lista
    // -----------------------
    test("CP-27: cargarInventarioLogic - devuelve lista", async () => {
        const fakeSnap = {
        empty: false,
        docs: [{ id: "i1", data: () => ({ nombre: "A" }) }],
        forEach(cb) { this.docs.forEach(cb); }
        };
        mockGetDocs.mockResolvedValueOnce(fakeSnap);
        const arr = await cargarInventarioLogic(db, { collection: mockCollection, getDocs: mockGetDocs });
        expect(Array.isArray(arr)).toBe(true);
        expect(arr[0].id).toBe("i1");
    });

    // -----------------------
    // CP-31: registrarDesperdicioLogic - registrar
    // -----------------------
    test("CP-31: registrarDesperdicioLogic - addDoc llamado", async () => {
        mockAddDoc.mockResolvedValueOnce({ id: "d1" });
        const data = { producto: "X", cantidad: 2 };
        const res = await registrarDesperdicioLogic(db, { collection: mockCollection, addDoc: mockAddDoc }, data);
        expect(res.ok).toBe(true);
        expect(mockAddDoc).toHaveBeenCalledWith(mockCollection(db, "desperdicios"), expect.objectContaining({ producto: "X" }));
    });

    // -----------------------
    // CP-32: cargarDesperdiciosLogic - devuelve lista
    // -----------------------
    test("CP-32: cargarDesperdiciosLogic - lista", async () => {
        const fakeSnap = { empty: false, docs: [{ id: "d1", data: () => ({ x: 1 }) }], forEach(cb) { this.docs.forEach(cb); } };
        mockGetDocs.mockResolvedValueOnce(fakeSnap);
        const arr = await cargarDesperdiciosLogic(db, { collection: mockCollection, getDocs: mockGetDocs });
        expect(arr.length).toBe(1);
    });

    // -----------------------
    // CP-33: cargarUsuariosLogic - devuelve lista
    // -----------------------
    test("CP-33: cargarUsuariosLogic - lista usuarios", async () => {
        const fakeSnap = { empty: false, docs: [{ id: "u1", data: () => ({ email: "a@a" }) }], forEach(cb) { this.docs.forEach(cb); } };
        mockGetDocs.mockResolvedValueOnce(fakeSnap);
        const arr = await cargarUsuariosLogic(db, { collection: mockCollection, getDocs: mockGetDocs });
        expect(arr[0].id).toBe("u1");
    });

    // -----------------------
    // CP-34: loadDashboardStats - cuenta colecciones
    // -----------------------
    test("CP-34: loadDashboardStats - devuelve stats con counts", async () => {
        // 4 llamadas a getDocs: menus, usuarios, inventario, desperdicios
        mockGetDocs
        .mockResolvedValueOnce({ size: 2 }) // menus
        .mockResolvedValueOnce({ size: 5 }) // users
        .mockResolvedValueOnce({ size: 3 }) // inventario
        .mockResolvedValueOnce({ size: 1 }); // desperdicios

        const stats = await loadDashboardStats(db, { collection: mockCollection, getDocs: mockGetDocs });
        expect(stats.menusCount).toBe(2);
        expect(stats.usersCount).toBe(5);
        expect(stats.inventarioCount).toBe(3);
        expect(stats.desperdiciosCount).toBe(1);
    });

    // -----------------------
    // CP-35: safeNum
    // -----------------------
    test("CP-35: safeNum - convierte y maneja nulos", () => {
        expect(safeNum(undefined)).toBe(0);
        expect(safeNum("")).toBe(0);
        expect(safeNum("12")).toBe(12);
        expect(safeNum(0)).toBe(0);
    });

    // -----------------------
    // CP-36: formatDateISO
    // -----------------------
    test("CP-36: formatDateISO - formato YYYY-MM-DD", () => {
        const s = formatDateISO(new Date("2020-01-02"));
        expect(s).toBe("2020-01-02");
        const s2 = formatDateISO();
        expect(s2).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    // -----------------------
    // CP-37: waitForFirebase
    // -----------------------
    test("CP-37: waitForFirebase - retorna true si db presente y false si no", async () => {
        expect(await waitForFirebase({} , 1, 1)).toBe(true);
        // attempts=1 and undefined db should return false quickly
        expect(await waitForFirebase(undefined, 1, 1)).toBe(false);
    });

    // -----------------------
    // CP-38: mostrarNotificacionLogic
    // -----------------------
    test("CP-38: mostrarNotificacionLogic - objeto correcto", () => {
        const note = mostrarNotificacionLogic("warn", "hola", 500);
        expect(note.type).toBe("warn");
        expect(note.message).toBe("hola");
        expect(note.timeout).toBe(500);
        expect(typeof note.createdAt).toBe("number");
    });

    // -----------------------
    // CP-39: attachTableActionListenersLogic
    // -----------------------
    test("CP-39: attachTableActionListenersLogic - handlers placeholders", () => {
        const handlers = attachTableActionListenersLogic();
        expect(typeof handlers.onEdit).toBe("function");
        expect(handlers.onEdit("x")).toEqual({ action: "edit", id: "x" });
        expect(handlers.onDelete("y")).toEqual({ action: "delete", id: "y" });
        expect(handlers.onToggleActive("z", true)).toEqual({ action: "toggle", id: "z", active: true });
    });

    // -----------------------
    // CP-40: agregarMenuEjemploLogic - fallback cuando addDoc falla
    // -----------------------
    test("CP-40: agregarMenuEjemploLogic - captura fallo addDoc", async () => {
        mockAddDoc.mockRejectedValueOnce(new Error("bad add"));
        await expect(agregarMenuEjemploLogic(db, { collection: mockCollection, addDoc: mockAddDoc })).rejects.toThrow();
    });

    // -----------------------
    // CP-41: guardarMenuLogic - update when updateDoc missing returns ok:false
    // -----------------------
    test("CP-41: guardarMenuLogic - update sin updateDoc devuelve ok:false y mensaje", async () => {
        // call with id but without updateDoc provided
        const data = { titulo: "T" };

        const firestorePartial = {
            collection: mockCollection,
            doc: mockDoc
            // intentionally no updateDoc
        };

        const res = await guardarMenuLogic(db, firestorePartial, null, {}, data, "id-1");
        expect(res).toBeDefined();
        expect(res.ok).toBe(false);
        expect(res.message).toMatch(/updateDoc/i);
    });

    // CP-42: uploadImageFile - storage null lanza error
    test("CP-42: uploadImageFile - storage null lanza error", async () => {
        const { uploadImageFile } = require("../Administrador/admin/adminController.logic.js");
        await expect(uploadImageFile(null, {}, { name: "img.png" })).rejects.toThrow(/Firebase Storage no inicializado/i);
    });

    // CP-43: uploadImageFile - storageFns incompletos lanza 'storageFns incompletos'
    test("CP-43: uploadImageFile - storageFns incompletos lanza error", async () => {
        const { uploadImageFile } = require("../Administrador/admin/adminController.logic.js");
        const fakeStorage = {}; // presente
        const storageFns = { ref: () => ({}), /* falta uploadBytes o getDownloadURL */ };
        await expect(uploadImageFile(fakeStorage, storageFns, { name: "img.png" })).rejects.toThrow(/storageFns incompletos/i);
    });

    // CP-44: cargarMenusLogic - orderBy falla y fallback a getDocs(ref)
    test("CP-44: cargarMenusLogic - orderBy falla y usa fallback getDocs", async () => {
        const { cargarMenusLogic } = require("../Administrador/admin/adminController.logic.js");
        const fakeDb = {};
        const firestoreFns = {
            collection: jest.fn(() => "ref"),
            query: jest.fn(() => { throw new Error("orderBy not supported"); }),
            orderBy: jest.fn(() => {}),
            getDocs: jest.fn(async (arg) => ({ forEach: (cb) => { cb({ id: 'm1', data: () => ({ titulo: 'x' }) }); }, size:1 }))
        };
        const res = await cargarMenusLogic(fakeDb, firestoreFns);
        expect(Array.isArray(res)).toBe(true);
        expect(res.length).toBeGreaterThan(0);
    });

    // CP-45: guardarMenuLogic - upload falla por CORS y NO genera imagen (manejo de error)
    test("CP-45: guardarMenuLogic - upload falla por CORS y continua sin imagen", async () => {
        const { guardarMenuLogic } = require("../Administrador/admin/adminController.logic.js");

        const fakeDb = {};
        const firestoreFns = {
            collection: jest.fn(() => "menusCol"),
            addDoc: jest.fn(async () => ({ id: "new-id" })),
        };

        const storage = {};
        const storageFns = {
            ref: jest.fn(),
            uploadBytes: jest.fn(() => { throw new Error("CORS"); }),
            getDownloadURL: jest.fn()
        };

        const data = { titulo: "T", file: { name: "img.png" } };

        const res = await guardarMenuLogic(fakeDb, firestoreFns, storage, storageFns, data);

        // La lógica REAL devuelve ok:false en caso de error en upload
        expect(res.ok).toBe(false);
        expect(res.message || res.mensaje).toBeDefined();
    });

    // CP-46: guardarMenuLogic - addDoc lanza permission-denied y se notifica
    test("CP-46: guardarMenuLogic - addDoc lanza permission-denied y captura", async () => {
        const { guardarMenuLogic } = require("../Administrador/admin/adminController.logic.js");
        const fakeDb = {};
        const firestoreFns = {
            collection: jest.fn(() => "menusCol"),
            addDoc: jest.fn(() => { throw { code: "permission-denied", message: "no perms" }; })
        };
        // espía notificación o console.error según implem.
        const res = await guardarMenuLogic(fakeDb, firestoreFns, null, {}, { titulo: "T" });
        expect(res.ok).toBe(false);
        expect(res.message || res.mensaje).toBeDefined();
    });

    test("CP-16: deleteImageByPath - storage null no explota y retorna not initialized", async () => {
        const result = await deleteImageByPath(null, storageFns, "menus/path.png");
        expect(result).toBeDefined();
        expect(result.ok).toBe(false);
    });

    test("CP-17: deleteImageByPath - deleteObject llamado con path", async () => {
        const result = await deleteImageByPath(storage, storageFns, "menus/to-delete.png");
        expect(mockRef).toHaveBeenCalledWith(storage, "menus/to-delete.png");
        expect(mockDeleteObject).toHaveBeenCalled();
        expect(result.ok).toBe(true);
    });

    test("CP-18: deleteImageByPath - deleteObject fallo manejado", async () => {
        mockDeleteObject.mockRejectedValueOnce(new Error("delete fail"));
        const result = await deleteImageByPath(storage, storageFns, "menus/bad.png");
        expect(result.ok).toBe(false);
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toMatch(/delete fail/);
    });

});
