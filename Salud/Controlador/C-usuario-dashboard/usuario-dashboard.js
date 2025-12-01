// Obtener nombre y foto del usuario desde el localStorage
const userName = localStorage.getItem("userName") || "Usuario";
const userPhoto = localStorage.getItem("userPhoto") || "../../imagenes/default-user.jpg";

// Mostrar los datos en la interfaz
document.getElementById("userName").textContent = userName;
document.getElementById("userNameMain").textContent = userName;
document.getElementById("userPhoto").src = userPhoto;

// Cerrar sesión
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("userName");
  localStorage.removeItem("userPhoto");
  window.location.href = "../Login/register-login.html";
});
