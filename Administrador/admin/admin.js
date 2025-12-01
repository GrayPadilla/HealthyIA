// JavaScript para la interfaz de administrador (solo UI)
(function () {

  // Evitar inicializaciones múltiples
  if (window.adminUIInitialized) return;
  window.adminUIInitialized = true;

  function initAdminUI() {

    // ============================
    // 🟦 1. NAVEGACIÓN ENTRE SECCIONES
    // ============================
    const menuItems = document.querySelectorAll(".menu-item");
    const contentSections = document.querySelectorAll(".content-section");
    const sectionTitle = document.getElementById("section-title");

    menuItems.forEach((item) => {
      item.addEventListener("click", function () {
        const targetSection = this.getAttribute("data-section");

        // actualizar activo
        menuItems.forEach((i) => i.classList.remove("active"));
        this.classList.add("active");

        // cambiar vista
        contentSections.forEach((section) => {
          section.classList.remove("active-section");
          if (section.id === targetSection) {
            section.classList.add("active-section");

            // 🔥 cargar datos reales desde adminController.js
            if (typeof window.cargarSeccion === "function") {
              setTimeout(() => window.cargarSeccion(targetSection), 50);
            }
            
            // Si volvemos al dashboard, actualizar estadísticas
            if (targetSection === "dashboard") {
              if (typeof window.actualizarDashboard === "function") {
              setTimeout(() => window.actualizarDashboard(), 100);
              } else if (typeof loadDashboardStats === "function") {
                setTimeout(() => loadDashboardStats(), 100);
              }
            }
          }
        });

        sectionTitle.textContent = this.querySelector("span").textContent;
      });
    });

    // ============================
    // 🟦 2. MODAL DE MENÚ
    // ============================
    const addMenuBtn = document.getElementById("add-menu-btn");
    const menuModal = document.getElementById("menu-modal");
    const closeModalBtns = document.querySelectorAll(".close-btn, .close-modal");
    const menuForm = document.getElementById("menu-form");

    if (addMenuBtn) {
      addMenuBtn.addEventListener("click", () => {
        // Limpiar formulario y resetear a modo creación
        const menuForm = document.getElementById("menu-form");
        if (menuForm) {
          menuForm.reset();
          const menuId = document.getElementById("menu-id");
          if (menuId) menuId.value = "";
          const modalTitle = document.getElementById("menu-modal-title");
          if (modalTitle) modalTitle.textContent = "Agregar Nuevo Menú";
          const filePreview = document.getElementById("file-preview");
          if (filePreview) {
            filePreview.style.display = "none";
          }
        }
        menuModal.style.display = "flex";
      });
    }

    closeModalBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Limpiar formulario al cerrar
        const menuForm = document.getElementById("menu-form");
        if (menuForm) {
          menuForm.reset();
          const menuId = document.getElementById("menu-id");
          if (menuId) menuId.value = "";
          const modalTitle = document.getElementById("menu-modal-title");
          if (modalTitle) modalTitle.textContent = "Agregar Nuevo Menú";
          const filePreview = document.getElementById("file-preview");
          if (filePreview) {
            filePreview.style.display = "none";
          }
        }
        menuModal.style.display = "none";
      });
    });

    window.addEventListener("click", (e) => {
      if (e.target === menuModal) {
        // Limpiar formulario al cerrar
        const menuForm = document.getElementById("menu-form");
        if (menuForm) {
          menuForm.reset();
          const menuId = document.getElementById("menu-id");
          if (menuId) menuId.value = "";
          const modalTitle = document.getElementById("menu-modal-title");
          if (modalTitle) modalTitle.textContent = "Agregar Nuevo Menú";
          const filePreview = document.getElementById("file-preview");
          if (filePreview) {
            filePreview.style.display = "none";
          }
        }
        menuModal.style.display = "none";
      }
    });

    // 🔥 Guardado real → adminController.js (guardarMenu)
    if (menuForm) {
      // Prevenir listeners duplicados
      if (menuForm.dataset.submitHandler) {
        console.log("⚠️ Listener ya existe, omitiendo...");
        return;
      }
      
      menuForm.dataset.submitHandler = "true";
      
      menuForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("📤 Formulario enviado, llamando a guardarMenu...");
        console.log("🔍 Verificando función guardarMenu:", typeof window.guardarMenu);

        // Ejecutar guardar menú REAL
        if (typeof window.guardarMenu === "function") {
          try {
            console.log("✅ Ejecutando guardarMenu...");
            await window.guardarMenu(e);
            console.log("✅ guardarMenu completado");
          } catch (error) {
            console.error("❌ Error en guardarMenu:", error);
            if (typeof window.mostrarNotificacion === "function") {
              window.mostrarNotificacion("Error al guardar el menú: " + error.message, "error");
            } else {
              alert("Error al guardar el menú: " + error.message);
            }
          }
        } else {
          console.error("❌ La función guardarMenu no está disponible");
          alert("Error: La función de guardado no está disponible. Recarga la página e intenta de nuevo.");
        }
        // El controlador ya maneja el cierre del modal y reset del form
      }, { once: false });
    } else {
      console.error("❌ Formulario menu-form no encontrado");
    }

    // Vista previa de imagen
    const fileInput = document.getElementById("menu-image");
    const filePreview = document.getElementById("file-preview");
    const previewImage = document.getElementById("preview-image");
    const fileName = document.getElementById("file-name");

    if (fileInput && filePreview && previewImage && fileName) {
      fileInput.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(e) {
            previewImage.src = e.target.result;
            fileName.textContent = file.name;
            filePreview.style.display = "block";
          };
          reader.readAsDataURL(file);
        } else {
          filePreview.style.display = "none";
        }
      });
    }

    // ============================
    // 🟦 3. BOTONES DE ACCIÓN EN TABLAS
    // ============================
    // Notas:
    // Los botones reales de editar y eliminar
    // se agregan dinámicamente en adminController.js
    // Así que aquí NO se agregan listeners duplicados
    // Solo dejamos esto vacío intencionalmente.
    // ============================


    // ============================
    // 🟦 4. CERRAR SESIÓN
    // ============================
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (confirm("¿Desea cerrar sesión?")) {
          localStorage.removeItem("usuarioActivo");
          window.location.href = "../../Salud/Vista/Registrar-login/register-login.html";
        }
      });
    }

    // ============================
    // 🟦 5. BOTÓN "ACTUALIZAR PREDICCIÓN"
    // ============================
    const updatePredictionBtn = document.getElementById("update-prediction");
    if (updatePredictionBtn) {
      updatePredictionBtn.addEventListener("click", async function () {
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';

        if (typeof window.actualizarPredicciones === "function") {
          await window.actualizarPredicciones();
        }

        this.disabled = false;
        this.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
      });
    }

    // ============================
    // 🟦 6. PLACEHOLDERS DE GRÁFICOS
    // ============================
    function initializeCharts() {
      document.querySelectorAll(".chart-placeholder").forEach((ph) => {
        // Si ya hay un canvas dentro, no sobrescribimos (evita borrar los canvas reales)
        if (ph.querySelector('canvas')) return;

        ph.innerHTML = `
          <div class="text-center">
            <i class="fas fa-chart-bar fa-2x mb-10" style="color:#2c7873;"></i>
            <p>Gráfico interactivo</p>
            <small>(Chart.js recomendado)</small>
          </div>
        `;
      });
    }
    initializeCharts();

    // ============================
    // 🟦 7. FILTROS DE REPORTES
    // ============================
    const reportPeriod = document.getElementById("report-period");
    if (reportPeriod) {
      reportPeriod.addEventListener("change", () => {
        if (typeof window.cargarReportes === "function") {
          window.cargarReportes(reportPeriod.value);
        }
      });
    }

    // ============================
    // 🟦 8. SWITCHES DE CONFIGURACIÓN
    // ============================
    const switches = document.querySelectorAll(".switch input");
    switches.forEach((sw) => {
      sw.addEventListener("change", async () => {
        if (typeof window.guardarConfiguracion === "function") {
          await window.guardarConfiguracion();
        }
      });
    });

    window.adminUIInitialized = true;

  }

  // Inicializar cuando el navegador esté listo
  function iniciarCuandoListo() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(initAdminUI, 50));
    } else if ("requestIdleCallback" in window) {
      requestIdleCallback(() => setTimeout(initAdminUI, 50));
    } else {
      setTimeout(initAdminUI, 100);
    }
  }

  iniciarCuandoListo();
})();
