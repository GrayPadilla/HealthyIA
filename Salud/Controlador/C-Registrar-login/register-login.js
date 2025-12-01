// register-login.js
import { auth, db } from "../../../__mocks__/firebaseMock.js";

// ==========================
// Lógica exportable para tests
// ==========================
export async function registrarUsuarioLogic(datos, authInstance = auth, fns = {}) {
  const {
    email,
    password,
    confirmPassword,
    edad,
    genero,
    altura,
    peso,
    preferenciaDieta = "sin-restriccion",
    restricciones = ""
  } = datos;

  if (!email || !password || !confirmPassword || !edad || !genero || !altura || !peso) {
    return { ok: false, mensaje: "Todos los campos son obligatorios" };
  }

  if (password !== confirmPassword) {
    return { ok: false, mensaje: "Las contraseñas no coinciden" };
  }

  try {
    // Usamos mock si no existe función real
    const userCredential = fns.createUserWithEmailAndPassword
      ? await fns.createUserWithEmailAndPassword(authInstance, email, password)
      : { user: { uid: "test-uid" } };
    const uid = userCredential.user.uid;

    if (fns.setDoc && fns.doc) {
      await fns.setDoc(fns.doc(db, "usuarios", uid), {
        email,
        edad,
        genero,
        altura,
        peso,
        preferenciaDieta,
        restricciones: restricciones ? restricciones.split(",").map(r => r.trim()) : [],
        rol: "usuario",
        registradoEn: fns.serverTimestamp ? fns.serverTimestamp() : null
      });
    }

    return { ok: true, mensaje: "Registro exitoso", uid };
  } catch (error) {
    return { ok: false, mensaje: error.message };
  }
}

export async function iniciarSesionLogic(email, password, authInstance = auth, fns = {}) {
  if (!email || !password) return { ok: false, mensaje: "Los campos son obligatorios" };

  try {
    const userCredential = fns.signInWithEmailAndPassword
      ? await fns.signInWithEmailAndPassword(authInstance, email, password)
      : { user: { uid: "test-uid" } };
    const uid = userCredential.user.uid;

    if (fns.getDocs && fns.query && fns.collection && fns.where) {
      const q = fns.query(fns.collection(db, "usuarios"), fns.where("email", "==", email));
      const snap = await fns.getDocs(q);

      if (snap.empty) return { ok: false, mensaje: "Usuario no encontrado" };

      const userData = snap.docs[0].data();
      return { ok: true, mensaje: "Inicio de sesión exitoso", uid, rol: userData.rol || "usuario" };
    }

    return { ok: true, mensaje: "Inicio de sesión simulado", uid };
  } catch (error) {
    return { ok: false, mensaje: error.message };
  }
}
