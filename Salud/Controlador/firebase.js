// firebase.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getFirestore,
  initializeFirestore
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { 
  getFunctions, 
  connectFunctionsEmulator 
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-functions.js";

// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB-TBAuXFUmgKx8evXOd8uz3OHTPFKAbsU",
  authDomain: "salud-5ac61.firebaseapp.com",
  databaseURL: "https://salud-5ac61-default-rtdb.firebaseio.com",
  projectId: "salud-5ac61",
  storageBucket: "salud-5ac61.firebasestorage.app",
  messagingSenderId: "429302364681",
  appId: "1:429302364681:web:6c0938df5ebe3269ef56d8",
  measurementId: "G-TDYTJW9ZR6"
};

let app, db, auth, functions;

try {
  const existingApps = getApps();

  if (existingApps.length === 0) {
    console.log("🔥 Inicializando Firebase por primera vez...");
    app = initializeApp(firebaseConfig);

    db = initializeFirestore(app, {
      cacheSizeBytes: 20 * 1024 * 1024,
      experimentalForceLongPolling: false,
      ignoreUndefinedProperties: true
    });

    auth = getAuth(app);
    functions = getFunctions(app);
    console.log("✅ Firebase inicializado correctamente");

  } else {
    console.log("🔥 Firebase ya estaba inicializado, reutilizando...");
    app = existingApps[0];
    db = getFirestore(app);
    auth = getAuth(app);
    functions = getFunctions(app);
    console.log("✅ Firebase reutilizado correctamente");
  }

} catch (error) {
  console.error("❌ Error al inicializar Firebase:", error);

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      console.log("🔄 Intentando recuperar Firebase existente...");
      app = existingApps[0];
      db = getFirestore(app);
      auth = getAuth(app);
      functions = getFunctions(app);
      console.log("✅ Firebase recuperado correctamente");
    } else {
      console.error("❌ No hay apps de Firebase disponibles");
    }
  } catch (critical) {
    console.error("❌ Error crítico al recuperar Firebase:", critical);
  }
}

// Verificar que todo esté inicializado
if (!db) {
  console.error("❌ ERROR CRÍTICO: db no está inicializado");
} else {
  console.log("✅ Firebase DB listo para usar");
}

// 🔥 Conectar al emulador de Functions SOLO si estás en localhost
// Solo si functions está inicializado
if (functions && typeof location !== 'undefined' && (location.hostname === "127.0.0.1" || location.hostname === "localhost")) {
  try {
    connectFunctionsEmulator(functions, "localhost", 5001);
  } catch (err) {
    console.warn("⚠️ No se pudo conectar al emulador de Functions:", err);
  }
}

// Obtener claims del usuario
export async function getUserClaims(forceRefresh = false) {
  if (!auth.currentUser) return null;

  const token = await auth.currentUser.getIdTokenResult(forceRefresh);
  return token.claims || {};
}

export { app, db, auth, functions };
