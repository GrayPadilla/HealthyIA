
document.addEventListener("DOMContentLoaded", () => {
  // 📊 Medir tiempo de carga de la página principal
  console.time("⏱️ Carga página Principal");
  
  // --- Base de datos de comidas saludables ---
  const comidasSaludables = [
    {
      id: 'pizza-natural',
      nombre: 'Pizza Natural',
      imagen: '../../imagenes/pizza.jpg',
      categoria: 'cena',
      tags: ['pizza', 'natural', 'saludable', 'vegetariano'],
      calorias: 380
    },
    {
      id: 'comidas-variadas',
      nombre: 'Comidas Variadas',
      imagen: '../../imagenes/comidas.jpg',
      categoria: 'almuerzo',
      tags: ['variado', 'completo', 'nutritivo', 'balanceado'],
      calorias: 450
    },
    {
      id: 'hamburguesa-natural',
      nombre: 'Hamburguesa Natural',
      imagen: '../../imagenes/hamburguesa.jpg',
      categoria: 'almuerzo',
      tags: ['hamburguesa', 'natural', 'proteína', 'carne'],
      calorias: 420
    },
    {
      id: 'pizza-casera',
      nombre: 'Pizza Casera',
      imagen: '../../imagenes/pizza-casera.jpg',
      categoria: 'cena',
      tags: ['pizza', 'casera', 'integral', 'vegetariano', 'saludable'],
      calorias: 350
    },
    {
      id: 'carne-asada',
      nombre: 'Carne Asada',
      imagen: '../../imagenes/carne.jpg',
      categoria: 'almuerzo',
      tags: ['carne', 'asada', 'proteína', 'alto-proteinas', 'pollo'],
      calorias: 400
    },
    {
      id: 'papas-mandarinas',
      nombre: 'Papas y Mandarinas',
      imagen: '../../imagenes/papas.jpg',
      categoria: 'snack',
      tags: ['papas', 'mandarinas', 'frutas', 'snack', 'vitaminas'],
      calorias: 180
    },
    {
      id: 'helado',
      nombre: 'Helado',
      imagen: '../../imagenes/helado.jpg',
      categoria: 'postre',
      tags: ['helado', 'postre', 'dulce', 'fresco'],
      calorias: 220
    },
    {
      id: 'keke-casero',
      nombre: 'Keke Casero',
      imagen: '../../imagenes/keke.jpg',
      categoria: 'postre',
      tags: ['keke', 'casero', 'postre', 'dulce', 'natural'],
      calorias: 280
    },
    {
      id: 'productos-naturales',
      nombre: 'Productos Naturales',
      imagen: '../../imagenes/frutas.jpg',
      categoria: 'snack',
      tags: ['frutas', 'natural', 'vitaminas', 'saludable', 'fresco'],
      calorias: 120
    }
  ];

  // --- Detectar cuando las secciones entran en pantalla ---
  const fadeSections = document.querySelectorAll(".fade-section");

  const activarFade = () => {
    fadeSections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        section.classList.add("visible");
      }
    });
  };

  window.addEventListener("scroll", activarFade);
  activarFade(); // Ejecutar al cargar por si ya hay secciones visibles

  // --- Redirección a la interfaz de login/registro ---
  document.querySelectorAll("button[data-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode; // "login" o "register"
      window.location.href = `../Registrar-login/register-login.html?mode=${mode}`;
    });
  });

  // --- Búsqueda en tiempo real ---
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  if (searchInput && searchResults) {
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      clearTimeout(searchTimeout);
      
      if (query.length === 0) {
        searchResults.classList.remove('active');
        return;
      }

      // Debounce para mejorar rendimiento
      searchTimeout = setTimeout(() => {
        const resultados = buscarComidas(query);
        mostrarResultados(resultados, query);
      }, 150);
    });

    // También buscar al hacer focus
    searchInput.addEventListener('focus', (e) => {
      const query = e.target.value.trim();
      if (query.length > 0) {
        const resultados = buscarComidas(query);
        mostrarResultados(resultados, query);
      }
    });

    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        searchResults.classList.remove('active');
      }
    });

    // Buscar al presionar Enter
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          localStorage.setItem('searchTerm', query);
          window.location.href = '../lista-comidas/lista-comidas.html';
        }
      }
    });

    // Click en icono de búsqueda
    const searchIcon = document.querySelector('.icon-search');
    if (searchIcon) {
      searchIcon.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
          localStorage.setItem('searchTerm', query);
          window.location.href = '../lista-comidas/lista-comidas.html';
        }
      });
    }
  }

  function buscarComidas(query) {
    if (!query || query.length < 1) return [];
    
    const queryLower = query.toLowerCase().trim();
    
    return comidasSaludables.filter(comida => {
      const nombreMatch = comida.nombre.toLowerCase().includes(queryLower);
      const categoriaMatch = comida.categoria.toLowerCase().includes(queryLower);
      const tagsMatch = comida.tags.some(tag => tag.toLowerCase().includes(queryLower));
      
      return nombreMatch || categoriaMatch || tagsMatch;
    }).sort((a, b) => {
      // Priorizar coincidencias exactas en el nombre
      const aExact = a.nombre.toLowerCase() === queryLower;
      const bExact = b.nombre.toLowerCase() === queryLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Luego priorizar coincidencias que empiezan con la query
      const aStarts = a.nombre.toLowerCase().startsWith(queryLower);
      const bStarts = b.nombre.toLowerCase().startsWith(queryLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return 0;
    });
  }

  function mostrarResultados(resultados, query) {
    if (!query || query.trim().length === 0) {
      searchResults.classList.remove('active');
      return;
    }

    if (resultados.length === 0) {
      searchResults.innerHTML = `
        <div class="no-results">
          <strong>🔍 No encontramos resultados</strong>
          <p>Intenta buscar: "pizza", "pollo", "vegetariano", "natural", "frutas"</p>
        </div>
      `;
      searchResults.classList.add('active');
      return;
    }

    const resultadosLimitados = resultados.slice(0, 6);
    searchResults.innerHTML = resultadosLimitados.map(comida => `
      <div class="search-result-item" data-food-id="${comida.id}">
        <img src="${comida.imagen}" alt="${comida.nombre}" onerror="this.src='../../imagenes/logo.jpg'">
        <div class="result-info">
          <div class="result-name">${resaltarTexto(comida.nombre, query)}</div>
          <div class="result-category">${comida.categoria.charAt(0).toUpperCase() + comida.categoria.slice(1)}</div>
        </div>
        <div class="result-badge">${comida.calorias} kcal</div>
      </div>
    `).join('');

    // Agregar event listeners a los resultados
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const foodId = item.dataset.foodId;
        const comida = comidasSaludables.find(c => c.id === foodId);
        if (comida) {
          localStorage.setItem('comidaSeleccionada', JSON.stringify(comida));
          window.location.href = '../comida-detalle/comida-detalle.html';
        }
      });
    });

    searchResults.classList.add('active');
  }

  function resaltarTexto(texto, query) {
    if (!query) return texto;
    const regex = new RegExp(`(${query})`, 'gi');
    return texto.replace(regex, '<mark style="background: rgba(43, 124, 255, 0.2); color: #2b7cff; font-weight: 600;">$1</mark>');
  }

  // --- Funciones de búsqueda (mantener compatibilidad) ---
  window.handleSearch = function(event) {
    if (event.key === 'Enter') performSearch();
  };

  window.performSearch = function() {
    const searchTerm = searchInput?.value.trim();
    if (searchTerm) {
      localStorage.setItem('searchTerm', searchTerm);
      window.location.href = '../lista-comidas/lista-comidas.html';
    } else {
      alert('💡 Escribe algo para buscar, por ejemplo: "pollo", "vegetariano", "natural"');
    }
  };

  // Búsqueda por voz
  const voiceIcon = document.querySelector('.icon-voice');
  if (voiceIcon) {
    voiceIcon.addEventListener('click', () => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = function(event) {
          const speechResult = event.results[0][0].transcript;
          if (searchInput) {
            searchInput.value = speechResult;
            searchInput.dispatchEvent(new Event('input'));
          }
        };

        recognition.onerror = function(event) {
          console.error('Error en reconocimiento de voz:', event.error);
          alert('🎤 Error en el reconocimiento de voz. Intenta escribir tu búsqueda.');
        };

        recognition.start();
      } else {
        alert('🎤 Búsqueda por voz no compatible con tu navegador. ¡Pero puedes escribir!');
      }
    });
  }

  window.startVoiceSearch = function() {
    const voiceIcon = document.querySelector('.icon-voice');
    if (voiceIcon) voiceIcon.click();
  };

  // Búsqueda por cámara
  const cameraIcon = document.querySelector('.icon-camera');
  if (cameraIcon) {
    cameraIcon.addEventListener('click', () => {
      alert('📷 ¡Próximamente! Podrás tomar fotos de tus comidas para obtener información nutricional instantánea.');
    });
  }

  window.startCameraSearch = function() {
    const cameraIcon = document.querySelector('.icon-camera');
    if (cameraIcon) cameraIcon.click();
  };

  // --- Funciones de comidas ---
  window.goToFood = function(foodId) {
    const foodData = getFoodInfo(foodId);
    localStorage.setItem('comidaSeleccionada', JSON.stringify(foodData));
    window.location.href = '../comida-detalle/comida-detalle.html';
  };

  function getFoodInfo(foodId) {
    const foods = {
      'pizza-casera': {
        id: 'pizza-casera',
        nombre: 'Pizza Casera Integral',
        imagen: '../../imagenes/pizza-casera.jpg',
        categoria: 'cena',
        calorias: 450,
        descripcion: 'Pizza casera con masa integral y ingredientes frescos.',
        proteinas: 20, carbohidratos: 55, grasas: 16, fibra: 8, azucar: 5, sodio: 600,
        ingredientes: ['Harina integral', 'Tomate', 'Queso mozzarella', 'Albahaca', 'Aceite de oliva'],
        preparacion: '1. Preparar la masa. 2. Agregar salsa de tomate. 3. Añadir queso y hornear.',
        tiempo: '45 minutos', dificultad: 'Medio',
        tags: ['vegetariano'], beneficios: ['Rico en fibra', 'Casero', 'Nutritivo']
      },
      'pollo-verduras': {
        id: 'pollo-verduras',
        nombre: 'Pollo con Verduras',
        imagen: '../../imagenes/carne.jpg',
        categoria: 'almuerzo',
        calorias: 420,
        descripcion: 'Pechuga de pollo a la plancha con vegetales frescos.',
        proteinas: 35, carbohidratos: 25, grasas: 15, fibra: 5, azucar: 8, sodio: 600,
        ingredientes: ['Pechuga de pollo', 'Brócoli', 'Zanahoria', 'Pimiento', 'Aceite de oliva'],
        preparacion: '1. Salpimentar el pollo. 2. Cocinar a la plancha. 3. Saltear verduras.',
        tiempo: '25 minutos', dificultad: 'Fácil',
        tags: ['alto-proteinas'], beneficios: ['Alto en proteínas', 'Bajo en grasas', 'Vitaminas']
      },
      'avena-frutas': {
        id: 'avena-frutas',
        nombre: 'Avena con Frutas',
        imagen: '../../imagenes/comidas.jpg',
        categoria: 'desayuno',
        calorias: 280,
        descripcion: 'Avena cremosa con frutas frescas y miel.',
        proteinas: 12, carbohidratos: 45, grasas: 8, fibra: 6, azucar: 15, sodio: 50,
        ingredientes: ['Avena', 'Leche', 'Plátano', 'Fresas', 'Miel', 'Nueces'],
        preparacion: '1. Cocinar avena. 2. Agregar frutas. 3. Endulzar con miel.',
        tiempo: '15 minutos', dificultad: 'Fácil',
        tags: ['vegetariano'], beneficios: ['Rico en fibra', 'Energético', 'Saludable']
      }
    };
    return foods[foodId] || foods['pizza-casera'];
  }

  // --- Interactividad visual de productos y características ---
  const products = document.querySelectorAll('.product');
  products.forEach(product => {
    product.style.cursor = 'pointer';
    product.style.transition = 'transform 0.3s ease';
    product.addEventListener('mouseenter', () => {
      product.style.transform = 'scale(1.05)';
    });
    product.addEventListener('mouseleave', () => {
      product.style.transform = 'scale(1)';
    });
  });

  const features = document.querySelectorAll('.feature');
  const destinations = [
    '../mi-perfil/mi-perfil.html',
    '../recomendaciones/recomendaciones.html',
    '../lista-comidas/lista-comidas.html',
    '../asistente-ia/asistente-ia.html'
  ];

  features.forEach((feature, index) => {
    feature.style.cursor = 'pointer';
    feature.style.transition = 'transform 0.3s ease';
    feature.addEventListener('click', () => {
      window.location.href = destinations[index] || '../lista-comidas/lista-comidas.html';
    });
    feature.addEventListener('mouseenter', () => {
      feature.style.transform = 'translateY(-5px)';
    });
    feature.addEventListener('mouseleave', () => {
      feature.style.transform = 'translateY(0)';
    });
  });
  
  // --- Modo Oscuro/Claro ---
  function initDarkMode() {
    console.log("🌙 Inicializando modo oscuro...");
    
    const darkModeToggle = document.getElementById("darkModeToggle");
    
    if (!darkModeToggle) {
      console.error('❌ Botón darkModeToggle no encontrado, reintentando...');
      setTimeout(initDarkMode, 300);
      return;
    }

    console.log('✅ Botón darkModeToggle encontrado');

    // Cargar estado del modo oscuro desde localStorage
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'enabled') {
      document.body.classList.add("dark-mode");
      updateDarkModeToggle(true);
    }

    // Agregar event listener con múltiples métodos
    darkModeToggle.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("🌙 Botón modo oscuro clickeado (onclick)");
      const isDark = document.body.classList.toggle("dark-mode");
      updateDarkModeToggle(isDark);
      localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
      console.log('✅ Modo oscuro:', isDark ? 'activado' : 'desactivado');
      return false;
    };

    // También agregar addEventListener como respaldo
    darkModeToggle.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("🌙 Botón modo oscuro clickeado (addEventListener)");
      const isDark = document.body.classList.toggle("dark-mode");
      updateDarkModeToggle(isDark);
      localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
      console.log('✅ Modo oscuro:', isDark ? 'activado' : 'desactivado');
    }, false);

    function updateDarkModeToggle(isDark) {
      const toggleIcon = darkModeToggle.querySelector('.toggle-icon');
      const toggleText = darkModeToggle.querySelector('.toggle-text');
      
      if (toggleIcon && toggleText) {
        if (isDark) {
          toggleIcon.textContent = '☀️';
          toggleText.textContent = 'Modo Claro';
        } else {
          toggleIcon.textContent = '🌙';
          toggleText.textContent = 'Modo Oscuro';
        }
        console.log('✅ Toggle actualizado:', isDark ? 'Modo Claro' : 'Modo Oscuro');
      } else {
        console.warn('⚠️ Elementos toggle-icon o toggle-text no encontrados');
        console.log('toggleIcon:', toggleIcon);
        console.log('toggleText:', toggleText);
      }
    }
    
    console.log("✅ Modo oscuro inicializado correctamente");
  }

  // Inicializar modo oscuro inmediatamente
  initDarkMode();
  
  // Cargar menús desde Firebase
  cargarMenusDesdeFirebase();
  
  // 📊 Finalizar medición de tiempo de carga
  console.timeEnd("⏱️ Carga página Principal");
});

// Función para inicializar filtros por categoría
function inicializarFiltrosCategoria() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  
  filterButtons.forEach(button => {
    button.addEventListener("click", function() {
      // Remover clase activa de todos los botones
      filterButtons.forEach(btn => {
        btn.classList.remove("active");
        btn.style.background = "white";
        btn.style.color = "#2b7cff";
      });
      
      // Agregar clase activa al botón clickeado
      this.classList.add("active");
      this.style.background = "#2b7cff";
      this.style.color = "white";
      
      // Obtener categoría seleccionada
      const categoriaSeleccionada = this.dataset.category;
      
      // Filtrar secciones
      const categorySections = document.querySelectorAll(".category-section");
      
      if (categoriaSeleccionada === "todos") {
        // Mostrar todas las categorías
        categorySections.forEach(section => {
          section.style.display = "block";
        });
      } else {
        // Mostrar solo la categoría seleccionada
        categorySections.forEach(section => {
          if (section.dataset.category === categoriaSeleccionada) {
            section.style.display = "block";
          } else {
            section.style.display = "none";
          }
        });
      }
      
      // Scroll suave a la primera sección visible
      const primeraSeccion = document.querySelector(".category-section[style*='block'], .category-section:not([style*='none'])");
      if (primeraSeccion) {
        primeraSeccion.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

// Función para cargar menús desde Firebase
async function cargarMenusDesdeFirebase() {
  const menusContainer = document.getElementById("menus-container");
  if (!menusContainer) {
    console.warn("⚠️ No se encontró el contenedor de menús");
    return;
  }

  // Mostrar indicador de carga
  menusContainer.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #2b7cff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="margin-top: 20px; color: #64748b; font-weight: 500;">Cargando menús...</p>
    </div>
  `;

  try {
    // Importar Firebase de forma dinámica
    const { db } = await import("../../Controlador/firebase.js");
    const { collection, getDocs, query, orderBy, where } = await import("https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js");
    
    if (!db) {
      console.warn("⚠️ Firebase no inicializado, usando menús por defecto");
      mostrarMenusPorDefecto(menusContainer);
      return;
    }

    console.log("🔄 Cargando menús desde Firebase...");
    
    // Obtener menús activos de Firebase
    const menusRef = collection(db, "menus");
    let menusSnapshot;
    
    try {
      // Intentar ordenar por fecha de creación con filtro de activos
      menusSnapshot = await getDocs(query(menusRef, where("activo", "==", true), orderBy("creado", "desc")));
      console.log("✅ Menús obtenidos con filtro activo y ordenado por fecha");
    } catch (error) {
      // Si falla el orderBy con where, intentar solo orderBy
      try {
        console.warn("⚠️ Error con where + orderBy, intentando solo orderBy:", error.message);
        menusSnapshot = await getDocs(query(menusRef, orderBy("creado", "desc")));
        console.log("✅ Menús obtenidos ordenados por fecha (sin filtro activo)");
      } catch (error2) {
        // Si falla, obtener todos sin ordenar
        console.warn("⚠️ Error al ordenar menús, obteniendo todos:", error2.message);
        menusSnapshot = await getDocs(menusRef);
        console.log("✅ Menús obtenidos sin ordenar");
      }
    }

    if (!menusSnapshot || menusSnapshot.empty) {
      console.log("ℹ️ No hay menús disponibles en Firebase");
      // Mostrar menús por defecto
      mostrarMenusPorDefecto(menusContainer);
      return;
    }

    // Filtrar solo menús activos si no se usó where
    let menusActivos = [];
    menusSnapshot.forEach((doc) => {
      const menuData = doc.data();
      // Solo incluir menús activos (activo !== false)
      if (menuData.activo !== false) {
        menusActivos.push({ id: doc.id, data: menuData });
      }
    });

    if (menusActivos.length === 0) {
      console.log("ℹ️ No hay menús activos disponibles");
      mostrarMenusPorDefecto(menusContainer);
      return;
    }

    // Ordenar por fecha de creación si no se ordenó antes
    if (menusActivos.length > 1) {
      menusActivos.sort((a, b) => {
        const fechaA = a.data.creado ? new Date(a.data.creado).getTime() : 0;
        const fechaB = b.data.creado ? new Date(b.data.creado).getTime() : 0;
        return fechaB - fechaA; // Más recientes primero
      });
    }

    // Agrupar menús por categoría (solo Desayuno, Almuerzo, Cena)
    const menusPorCategoria = {
      "Desayuno": [],
      "Almuerzo": [],
      "Cena": []
    };

    menusActivos.forEach((menu) => {
      let categoria = menu.data.categoria || "Almuerzo"; // Por defecto Almuerzo si no tiene categoría
      const categoriaNormalizada = categoria.charAt(0).toUpperCase() + categoria.slice(1);
      
      // Convertir "Ensaladas" o "Otros" a "Almuerzo"
      if (categoriaNormalizada === "Ensaladas" || categoriaNormalizada === "Otros") {
        categoria = "Almuerzo";
      }
      
      // Solo agregar si es una de las 3 categorías válidas
      if (menusPorCategoria[categoria]) {
        menusPorCategoria[categoria].push(menu);
      } else {
        // Si no coincide, agregar a Almuerzo por defecto
        menusPorCategoria["Almuerzo"].push(menu);
      }
    });

    menusContainer.innerHTML = "";

    // Crear secciones por categoría (solo Desayuno, Almuerzo, Cena)
    const categoriasOrden = ["Desayuno", "Almuerzo", "Cena"];
    const iconosCategoria = {
      "Desayuno": "🌅",
      "Almuerzo": "☀️",
      "Cena": "🌙"
    };

    categoriasOrden.forEach(categoria => {
      const menusCategoria = menusPorCategoria[categoria];
      if (menusCategoria.length === 0) return;

      // Crear sección de categoría
      const categorySection = document.createElement("div");
      categorySection.className = "category-section";
      categorySection.dataset.category = categoria;
      
      const categoryTitle = document.createElement("h3");
      categoryTitle.style.cssText = "margin: 30px 0 20px 0; font-size: 1.5rem; color: #2b7cff; font-weight: 700; text-align: center;";
      categoryTitle.textContent = `${iconosCategoria[categoria] || "🍽️"} ${categoria}`;
      categorySection.appendChild(categoryTitle);

      const categoryGallery = document.createElement("div");
      categoryGallery.className = "product-gallery";
      categoryGallery.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px;";

      // Crear tarjetas para cada menú de esta categoría
      menusCategoria.forEach((menu) => {
        const menuData = menu.data;
        const menuId = menu.id;

        const menuCard = document.createElement("div");
        menuCard.className = "product";
        menuCard.style.cursor = "pointer";
        menuCard.dataset.menuId = menuId;
        menuCard.dataset.categoria = categoria;

        const imagenURL = menuData.imagenURL || "../../imagenes/comidas.jpg";
        const nombre = menuData.nombre || "Menú sin nombre";
        const precio = menuData.precio ? `S/ ${Number(menuData.precio).toFixed(2)}` : "";
        const calorias = menuData.calorias ? `${menuData.calorias} kcal` : "";

        menuCard.innerHTML = `
          <img src="${imagenURL}" alt="${nombre}" onerror="this.src='../../imagenes/comidas.jpg'">
          <div class="product-info">
            <p class="product-name">${nombre}</p>
            ${precio ? `<p class="product-price">${precio}</p>` : ""}
            ${calorias ? `<p class="product-calories">${calorias}</p>` : ""}
          </div>
        `;

        // Agregar evento click para ver detalles
        menuCard.addEventListener("click", () => {
          const menuParaDetalle = {
            id: menuId,
            nombre: menuData.nombre,
            imagen: imagenURL,
            categoria: menuData.categoria || "almuerzo",
            calorias: menuData.calorias || 0,
            precio: menuData.precio || 0,
            descripcion: menuData.descripcion || "",
            proteinas: menuData.proteinas || 0,
            carbohidratos: menuData.carbohidratos || 0,
            grasas: menuData.grasas || 0,
            fibra: menuData.fibra || 0,
            azucar: menuData.azucar || 0,
            sodio: menuData.sodio || 0,
            tiempo: menuData.tiempo || "20 minutos",
            dificultad: menuData.dificultad || "Media",
            ingredientes: menuData.ingredientes || [],
            preparacion: menuData.preparacion || "",
            tags: menuData.tags || [],
            beneficios: menuData.beneficios || []
          };
          
          localStorage.setItem("comidaSeleccionada", JSON.stringify(menuParaDetalle));
          window.location.href = "../comida-detalle/comida-detalle.html";
        });

        categoryGallery.appendChild(menuCard);
      });

      categorySection.appendChild(categoryGallery);
      menusContainer.appendChild(categorySection);
    });

    // Inicializar filtros
    inicializarFiltrosCategoria();

    console.log(`✅ ${menusActivos.length} menús cargados desde Firebase agrupados por categoría`);
  } catch (error) {
    console.error("❌ Error cargando menús desde Firebase:", error);
    console.error("Detalles del error:", error.message, error.stack);
    // Mostrar menús por defecto en caso de error
    const menusContainer = document.getElementById("menus-container");
    if (menusContainer) {
      mostrarMenusPorDefecto(menusContainer);
    }
  }
}

// Función para mostrar menús por defecto
function mostrarMenusPorDefecto(container) {
  const menusPorDefecto = [
    { imagen: "../../imagenes/pizza.jpg", nombre: "Pizza natural" },
    { imagen: "../../imagenes/comidas.jpg", nombre: "Comidas variadas" },
    { imagen: "../../imagenes/hamburguesa.jpg", nombre: "Hamburguesa natural" },
    { imagen: "../../imagenes/pizza-casera.jpg", nombre: "Pizza casera" },
    { imagen: "../../imagenes/carne.jpg", nombre: "Carne asada" },
    { imagen: "../../imagenes/papas.jpg", nombre: "Papas y mandarinas" },
    { imagen: "../../imagenes/helado.jpg", nombre: "Helado" },
    { imagen: "../../imagenes/keke.jpg", nombre: "Keke casero" },
    { imagen: "../../imagenes/frutas.jpg", nombre: "Productos naturales" }
  ];

  menusPorDefecto.forEach(menu => {
    const menuCard = document.createElement("div");
    menuCard.className = "product";
    menuCard.innerHTML = `
      <img src="${menu.imagen}" alt="${menu.nombre}">
      <p>${menu.nombre}</p>
    `;
    container.appendChild(menuCard);
  });
}
