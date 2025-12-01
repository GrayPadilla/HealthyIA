// __mocks__/firebaseMock.js
// Mock central compartido para register-login y adminController.logic tests

// --- existentes (no cambiar) ---
export const app = {};
export const db = {};
export const auth = { currentUser: null };
export const functions = {};

export const initializeApp = jest.fn();
export const getApps = jest.fn(() => []);
export const getAuth = jest.fn(() => auth);
export const getFirestore = jest.fn(() => db);
export const getFunctions = jest.fn(() => functions);

export async function getUserClaims() {
  return {};
}

// --- Añadidos mínimos para adminController.logic.js ---

// Firestore-like mocks
export const collection = jest.fn((dbArg, name) => ({ __collection: name }));
export const doc = jest.fn((dbArg, col, id) => ({ __doc: `${col}/${id}`, id }));
export const query = jest.fn((ref, ...args) => ({ __query: ref, args }));
export const where = jest.fn((field, op, value) => ({ __where: [field, op, value] }));
export const orderBy = jest.fn((field, dir) => ({ __orderBy: [field, dir] }));

// Data operation mocks (defaults: getDocs returns empty snapshot)
export const getDocs = jest.fn(async (qOrRef) => {
  return {
    size: 0,
    empty: true,
    docs: [],
    forEach: (cb) => { /* no-op */ }
  };
});
export const addDoc = jest.fn(async (colRef, data) => ({ id: "mock-id", data }));
export const setDoc = jest.fn(async (docRef, data) => true);
export const getDoc = jest.fn(async (docRef) => ({ exists: () => false, data: () => ({}) }));
export const updateDoc = jest.fn(async (docRef, data) => true);
export const deleteDoc = jest.fn(async (docRef) => true);

// serverTimestamp mock (returns a simple marker; tests can ignore its shape)
export const serverTimestamp = jest.fn(() => ({ _mockServerTimestamp: Date.now() }));

// --- Storage-like mocks ---
export const storage = {}; // placeholder

export const ref = jest.fn((storageArg, path) => ({ __ref: path }));
export const uploadBytes = jest.fn(async (sRef, file) => ({ bytesTransferred: file?.size || 0, ref: sRef }));
export const getDownloadURL = jest.fn(async (sRef) => `https://example.com/${sRef.__ref}`);
export const deleteObject = jest.fn(async (sRef) => true);

// --- Auth helpers (opcional, por compatibilidad) ---
export const createUserWithEmailAndPassword = jest.fn(async (authInst, email, password) => {
  return { user: { uid: "mock-uid", email } };
});
export const signInWithEmailAndPassword = jest.fn(async (authInst, email, password) => {
  return { user: { uid: "mock-uid", email } };
});

// --- Default export (opcional) ---
export default {
  app, db, auth, functions,
  initializeApp, getApps, getAuth, getFirestore, getFunctions, getUserClaims,
  collection, doc, query, where, orderBy,
  getDocs, addDoc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp,
  storage, ref, uploadBytes, getDownloadURL, deleteObject,
  createUserWithEmailAndPassword, signInWithEmailAndPassword
};
