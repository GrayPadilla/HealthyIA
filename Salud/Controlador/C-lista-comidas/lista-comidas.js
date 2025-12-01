// Funcionalidad para la lista de comidas

// Variables globales
let currentCategory = 'todos';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // 📊 Medir tiempo de carga de la lista de comidas
    if (typeof console !== 'undefined' && console.time) {
        console.time("⏱️ Carga lista de comidas");
    }
    
    // Verificar si las funciones de métricas están disponibles
    if (typeof medirTiempoFuncion === 'function') {
        medirTiempoFuncion('inicializarListaComidas', () => {
            initializeFilters();
            initializeSearch();
            showAllCategories();
            handleIncomingSearch();
        });
    } else {
        // Si no están disponibles, ejecutar directamente
        initializeFilters();
        initializeSearch();
        showAllCategories();
        handleIncomingSearch();
    }
    
    // 📊 Finalizar medición
    if (typeof console !== 'undefined' && console.timeEnd) {
        console.timeEnd("⏱️ Carga lista de comidas");
    }
});

// Manejar búsqueda desde página principal
function handleIncomingSearch() {
    const searchTerm = localStorage.getItem('searchTerm');
    if (searchTerm) {
        document.getElementById('searchInput').value = searchTerm;
        localStorage.removeItem('searchTerm'); // Limpiar después de usar
        applyFilters();
        // Scroll a los resultados
        document.querySelector('.comidas-container').scrollIntoView({ behavior: 'smooth' });
    }
}

// Inicializar filtros de categorías
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase activa de todos los botones
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Agregar clase activa al botón clickeado
            this.classList.add('active');
            
            // Obtener categoría seleccionada
            currentCategory = this.dataset.category;
            
            // Filtrar comidas
            filterFoodsByCategory(currentCategory);
        });
    });
}

// Inicializar búsqueda
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const dietFilter = document.getElementById('dietFilter');
    
    searchInput.addEventListener('input', function() {
        applyFilters();
    });
    
    dietFilter.addEventListener('change', function() {
        applyFilters();
    });
}

// Filtrar por categoría
function filterFoodsByCategory(category) {
    const sections = document.querySelectorAll('.category-section');
    
    if (category === 'todos') {
        sections.forEach(section => {
            section.classList.remove('hidden');
        });
    } else {
        sections.forEach(section => {
            if (section.dataset.category === category) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });
    }
    
    // Aplicar otros filtros
    applyFilters();
}

// Aplicar todos los filtros
function applyFilters() {
    // 📊 Medir tiempo de aplicación de filtros (si está disponible)
    const ejecutarFiltros = () => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const dietFilter = document.getElementById('dietFilter').value;
        const foodCards = document.querySelectorAll('.comida-card');
        
        foodCards.forEach(card => {
            const foodName = card.querySelector('h3').textContent.toLowerCase();
            const cardDiet = card.dataset.diet || '';
            
            // Verificar si la tarjeta está en una sección visible
            const parentSection = card.closest('.category-section');
            const sectionVisible = !parentSection.classList.contains('hidden');
            
            // Verificar filtros
            const matchesSearch = searchTerm === '' || foodName.includes(searchTerm);
            const matchesDiet = dietFilter === '' || cardDiet === dietFilter || 
                               card.querySelector(`.tag.${dietFilter}`) !== null;
            
            // Mostrar/ocultar tarjeta
            if (sectionVisible && matchesSearch && matchesDiet) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    };
    
    if (typeof medirTiempoFuncion === 'function') {
        medirTiempoFuncion('applyFilters', ejecutarFiltros);
    } else {
        ejecutarFiltros();
    }
}

// Mostrar todas las categorías
function showAllCategories() {
    const sections = document.querySelectorAll('.category-section');
    sections.forEach(section => {
        section.classList.remove('hidden');
    });
}

// Función para ver detalle de comida
function verDetalle(comidaId) {
    // Guardar información en localStorage para usar en la página de detalle
    const comidaData = getComidaData(comidaId);
    localStorage.setItem('comidaSeleccionada', JSON.stringify(comidaData));
    
    // Redirigir a página de detalle
    window.location.href = '../comida-detalle/comida-detalle.html';
}

// Obtener datos de la comida
function getComidaData(comidaId) {
    const comidasData = {
        'avena-frutas': {
            id: 'avena-frutas',
            nombre: 'Avena con Frutas',
            imagen: '../../imagenes/avena-frutas.jpg',
            imagenFallback: '../../imagenes/comidas.jpg',
            categoria: 'desayuno',
            calorias: 280,
            descripcion: 'Deliciosa avena cremosa con frutas frescas, perfecta para comenzar el día con energía.',
            proteinas: 12,
            carbohidratos: 45,
            grasas: 8,
            fibra: 6,
            azucar: 15,
            sodio: 50,
            ingredientes: ['Avena integral', 'Leche descremada', 'Plátano', 'Fresas', 'Miel', 'Nueces'],
            preparacion: '1. Cocinar la avena con leche. 2. Agregar las frutas. 3. Endulzar con miel.',
            tiempo: '15 minutos',
            dificultad: 'Fácil',
            tags: ['vegetariano', 'alto-fibra'],
            beneficios: ['Rica en fibra', 'Fuente de energía', 'Antioxidantes naturales']
        },
        'huevos-revueltos': {
            id: 'huevos-revueltos',
            nombre: 'Huevos Revueltos con Tostadas',
            imagen: '../../imagenes/huevos-revueltos.jpg',
            imagenFallback: '../../imagenes/comidas.jpg',
            categoria: 'desayuno',
            calorias: 350,
            descripcion: 'Huevos revueltos cremosos acompañados de tostadas integrales.',
            proteinas: 25,
            carbohidratos: 20,
            grasas: 18,
            fibra: 3,
            azucar: 2,
            sodio: 400,
            ingredientes: ['Huevos', 'Pan integral', 'Mantequilla', 'Leche', 'Sal', 'Pimienta'],
            preparacion: '1. Batir huevos con leche. 2. Cocinar a fuego lento. 3. Tostar el pan.',
            tiempo: '10 minutos',
            dificultad: 'Fácil',
            tags: ['alto-proteinas'],
            beneficios: ['Alto en proteínas', 'Aminoácidos esenciales', 'Energía duradera']
        },
        'smoothie-verde': {
            id: 'smoothie-verde',
            nombre: 'Smoothie Verde',
            imagen: '../../imagenes/smoothie-verde.jpg',
            imagenFallback: '../../imagenes/frutas.jpg',
            categoria: 'desayuno',
            calorias: 220,
            descripcion: 'Batido nutritivo con vegetales verdes y frutas.',
            proteinas: 8,
            carbohidratos: 35,
            grasas: 5,
            fibra: 8,
            azucar: 20,
            sodio: 30,
            ingredientes: ['Espinacas', 'Plátano', 'Manzana verde', 'Apio', 'Agua de coco'],
            preparacion: '1. Lavar vegetales. 2. Licuar todos los ingredientes. 3. Servir frío.',
            tiempo: '5 minutos',
            dificultad: 'Muy fácil',
            tags: ['vegano', 'bajo-calorias'],
            beneficios: ['Rico en vitaminas', 'Detoxificante', 'Hidratante']
        },
        'pollo-verduras': {
            id: 'pollo-verduras',
            nombre: 'Pollo a la Plancha con Verduras',
            imagen: '../../imagenes/pollo-verduras.jpg',
            imagenFallback: '../../imagenes/carne.jpg',
            categoria: 'almuerzo',
            calorias: 420,
            descripcion: 'Pechuga de pollo jugosa con vegetales frescos salteados.',
            proteinas: 35,
            carbohidratos: 25,
            grasas: 15,
            fibra: 5,
            azucar: 8,
            sodio: 600,
            ingredientes: ['Pechuga de pollo', 'Brócoli', 'Zanahoria', 'Pimiento', 'Aceite de oliva'],
            preparacion: '1. Salpimentar el pollo. 2. Cocinar a la plancha. 3. Saltear verduras.',
            tiempo: '25 minutos',
            dificultad: 'Medio',
            tags: ['alto-proteinas', 'bajo-calorias'],
            beneficios: ['Proteína completa', 'Rico en vitaminas', 'Bajo en grasas']
        },
        'ensalada-quinoa': {
            id: 'ensalada-quinoa',
            nombre: 'Ensalada de Quinoa',
            imagen: '../../imagenes/ensalada-quinoa.jpg',
            imagenFallback: '../../imagenes/comidas.jpg',
            categoria: 'almuerzo',
            calorias: 380,
            descripcion: 'Ensalada nutritiva con quinoa, vegetales frescos y aderezo natural.',
            proteinas: 18,
            carbohidratos: 45,
            grasas: 12,
            fibra: 7,
            azucar: 6,
            sodio: 300,
            ingredientes: ['Quinoa', 'Tomate', 'Pepino', 'Aguacate', 'Limón', 'Aceite de oliva'],
            preparacion: '1. Cocinar quinoa. 2. Picar vegetales. 3. Mezclar con aderezo.',
            tiempo: '20 minutos',
            dificultad: 'Fácil',
            tags: ['vegetariano', 'alto-fibra'],
            beneficios: ['Proteína vegetal', 'Sin gluten', 'Rico en minerales']
        }
    };
    
    return comidasData[comidaId] || null;
}

// Funciones de animación
function animateCards() {
    const cards = document.querySelectorAll('.comida-card:not(.hidden)');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        }, index * 100);
    });
}

// Efectos de hover mejorados
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.comida-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});