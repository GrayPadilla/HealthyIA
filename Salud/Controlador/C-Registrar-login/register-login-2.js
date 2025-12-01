// register-login.js

import { auth, db } from "../../Controlador/firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";


document.addEventListener("DOMContentLoaded", () => {

  console.time("⏱️ Carga módulo Login/Registro");

  if (window.location.protocol === 'file:') {
    alert("⚠️ Este proyecto requiere servidor local.\nEjecuta:\npython -m http.server 8000\n\nLuego abre:\nhttp://localhost:8000/Salud/Vista/Registrar-login/register-login.html");
  }

  console.log("🔍 Verificando conexión Firebase...");
  console.log("📍 URL:", window.location.href);

  setTimeout(() => console.timeEnd("⏱️ Carga módulo Login/Registro"), 100);

  const loginForm = document.querySelector(".login-form");
  const registerForm = document.querySelector(".register-form");
  const loginBtn = document.querySelector(".login-btn");
  const registerBtn = document.querySelector(".register-btn");
  const title = document.getElementById("formTitle");
  const subText = document.getElementById("formSubText");
  const formRegistro = document.getElementById("registerForm");
  const formLogin = document.getElementById("loginForm");

  if (!loginForm || !registerForm || !loginBtn || !registerBtn || !title || !subText || !formRegistro || !formLogin) {
    console.error("❌ Error: No se encontró parte del DOM.");
    return;
  }

  console.log("✅ DOM cargado correctamente");

  initDarkMode();

  // ---------- ID SYNC ----------
  function syncInputIds(showing) {
    const loginEmail = loginForm.querySelector("input[type='email']");
    const loginPass = loginForm.querySelector("input[type='password']");
    const regEmail = formRegistro.querySelector("input[type='email']");
    const regPass = formRegistro.querySelector("input[type='password']#password")
      || formRegistro.querySelector("input[type='password']");

    if (showing === "login") {
      loginEmail.id = "email";
      loginPass.id = "password";
      regEmail.removeAttribute("id");
      if (regPass) regPass.removeAttribute("id");
    } else {
      regEmail.id = "email";
      regPass.id = "password";
      loginEmail.removeAttribute("id");
      loginPass.removeAttribute("id");
    }
  }

  // ---------- SHOW LOGIN ----------
  function showLogin() {
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    title.textContent = "INGRESA";
    subText.innerHTML = 'Si no tienes una cuenta, puedes<br><a href="#" id="toggleLink">Registrarte acá</a>';
    syncInputIds("login");
    loginBtn.classList.add("active");
    registerBtn.classList.remove("active");
  }

  // ---------- SHOW REGISTER ----------
  function showRegister() {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    title.textContent = "REGÍSTRATE";
    subText.innerHTML = 'Si ya tienes una cuenta, puedes<br><a href="#" id="toggleLink">Ingresar aquí</a>';
    syncInputIds("register");
    registerBtn.classList.add("active");
    loginBtn.classList.remove("active");
  }

  // ---------- BUTTON HANDLERS ----------
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault(); showLogin();
  });

  registerBtn.addEventListener("click", (e) => {
    e.preventDefault(); showRegister();
  });

  document.body.addEventListener("click", (e) => {
    if (e.target.id === "toggleLink") {
      e.preventDefault();
      if (loginForm.classList.contains("hidden")) showLogin();
      else showRegister();
    }
  });

  const mode = new URLSearchParams(window.location.search).get("mode");
  if (mode === "register") showRegister();
  else showLogin();

  // ---------- DARK MODE ----------
  function initDarkMode() {
    const darkModeToggle = document.getElementById("darkModeToggle");

    if (!darkModeToggle) {
      setTimeout(initDarkMode, 300);
      return;
    }

    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "enabled") {
      document.body.classList.add("dark-mode");
      updateDarkModeToggle(true);
    }

    darkModeToggle.addEventListener("click", (e) => {
      e.preventDefault();
      const isDark = document.body.classList.toggle("dark-mode");
      updateDarkModeToggle(isDark);
      localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
    });

    function updateDarkModeToggle(isDark) {
      const icon = darkModeToggle.querySelector(".toggle-icon");
      const text = darkModeToggle.querySelector(".toggle-text");
      if (!icon || !text) return;

      icon.textContent = isDark ? "☀️" : "🌙";
      text.textContent = isDark ? "Modo Claro" : "Modo Oscuro";
    }
  }

  // ======================================================================
  // ██████╗ ███████╗ ██████╗  █████╗ ██╗ ██████╗ ███████╗
  // ██╔══██╗██╔════╝██╔════╝ ██╔══██╗██║██╔═══██╗██╔════╝   REGISTRO SEGURO
  // ██████╔╝█████╗  ██║  ███╗███████║██║██║   ██║███████╗
  // ██╔═══╝ ██╔══╝  ██║   ██║██╔══██║██║██║   ██║╚════██║
  // ██║     ███████╗╚██████╔╝██║  ██║██║╚██████╔╝███████║
  // ╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚══════╝
  // ======================================================================

  async function registrarUsuario(e) {
    e.preventDefault();

    const email = formRegistro.querySelector("#email")?.value.trim();
    const password = formRegistro.querySelector("#password")?.value.trim();
    const confirmPassword = formRegistro.querySelector("#confirmPassword")?.value.trim();
    const edad = formRegistro.querySelector("#edad")?.value.trim();
    const genero = formRegistro.querySelector("#genero")?.value.trim();
    const altura = formRegistro.querySelector("#altura")?.value.trim();
    const peso = formRegistro.querySelector("#peso")?.value.trim();
    const preferenciaDieta = formRegistro.querySelector("#preferenciaDieta")?.value || "sin-restriccion";
    const restricciones = formRegistro.querySelector("#restricciones")?.value.trim() || "";

    if (!email || !password || !confirmPassword || !edad || !genero || !altura || !peso) {
      alert("⚠️ Todos los campos son obligatorios.");
      return;
    }
    if (password !== confirmPassword) {
      alert("❌ Las contraseñas no coinciden");
      return;
    }

    try {
      // 🔥 Crear usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 🔥 Guardar datos en Firestore
      await setDoc(doc(db, "usuarios", uid), {
        email,
        edad,
        genero,
        altura,
        peso,
        preferenciaDieta,
        restricciones: restricciones ? restricciones.split(",").map(r => r.trim()) : [],
        rol: "usuario",
        registradoEn: serverTimestamp()
      });

      alert("✅ Registro exitoso");
      localStorage.setItem("usuarioActivo", uid);

      window.location.href = "../lista-comidas/lista-comidas.html";

    } catch (error) {
      console.error("❌ Error al registrar:", error);
      alert("❌ Error: " + error.message);
    }
  }

  formRegistro.addEventListener("submit", registrarUsuario);

  // ======================================================================
  // ██╗      ██╗ ██████╗ ███╗   ██╗  LOGIN SEGURO
  // ██║      ██║██╔═══██╗████╗  ██║
  // ██║      ██║██║   ██║██╔██╗ ██║
  // ██║      ██║██║   ██║██║╚██╗██║
  // ███████╗██║╚██████╔╝██║ ╚████║
  // ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
  // ======================================================================

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = formLogin.querySelector("input[type='email']").value.trim();
    const password = formLogin.querySelector("input[type='password']").value.trim();

    if (!email || !password) {
      alert("⚠️ Ingresa tu correo y contraseña.");
      return;
    }

    try {
      // 🔥 Login en Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 🔥 Buscar datos del usuario
      const q = query(collection(db, "usuarios"), where("email", "==", email));
      const snap = await getDocs(q);

      if (snap.empty) {
        alert("⚠️ Usuario sin registro en Firestore.");
        return;
      }

      const userData = snap.docs[0].data();
      const rol = userData.rol || "usuario";

      localStorage.setItem("usuarioActivo", uid);

      if (rol === "admin") {
        window.location.href = "/Administrador/admin/admin.html";
      } else {
        window.location.href = "../lista-comidas/lista-comidas.html";
      }

    } catch (error) {
      console.error("❌ Error al iniciar sesión:", error);
      alert("❌ Error al iniciar sesión: " + error.message);
    }
  });

});
