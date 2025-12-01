// Funcionalidad para la página de detalle de comida

// Variables globales
let currentFoodData = null;
let isFavorite = false;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // 📊 Medir tiempo de carga del detalle de comida
    if (typeof console !== 'undefined' && console.time) {
        console.time("⏱️ Carga detalle de comida");
    }
    
    const inicializar = () => {
        loadFoodData();
        initializeTabs();
        setTimeout(hideLoading, 1500); // Simular carga
    };
    
    // Verificar si las funciones de métricas están disponibles
    if (typeof medirTiempoFuncion === 'function') {
        medirTiempoFuncion('cargarDetalleComida', inicializar);
    } else {
        inicializar();
    }
    
    // 📊 Finalizar medición
    if (typeof console !== 'undefined' && console.timeEnd) {
        console.timeEnd("⏱️ Carga detalle de comida");
    }
});

// Cargar datos de la comida
function loadFoodData() {
    // 📊 Medir tiempo de carga de datos (si está disponible)
    const cargar = () => {
        // Obtener datos del localStorage
        const storedData = localStorage.getItem('comidaSeleccionada');
        
        if (storedData) {
            currentFoodData = JSON.parse(storedData);
            populateContent();
        } else {
            // Datos por defecto si no hay información
            currentFoodData = getDefaultFoodData();
            populateContent();
        }
    };
    
    if (typeof medirTiempoFuncion === 'function') {
        medirTiempoFuncion('loadFoodData', cargar);
    } else {
        cargar();
    }
}

// Datos por defecto
function getDefaultFoodData() {
    return {
        id: 'default',
        nombre: 'Plato Nutritivo',
        imagen: '../../imagenes/comidas.jpg',
        categoria: 'almuerzo',
        calorias: 350,
        descripcion: 'Un delicioso plato balanceado perfecto para cualquier momento del día.',
        proteinas: 25,
        carbohidratos: 40,
        grasas: 12,
        fibra: 8,
        azucar: 6,
        sodio: 400,
        ingredientes: ['Ingrediente 1', 'Ingrediente 2', 'Ingrediente 3'],
        preparacion: '1. Preparar ingredientes. 2. Cocinar según instrucciones. 3. Servir caliente.',
        tiempo: '20 minutos',
        dificultad: 'Medio',
        tags: ['saludable'],
        beneficios: ['Nutritivo', 'Balanceado', 'Energético']
    };
}

// Poblar contenido en la página
function populateContent() {
    if (!currentFoodData) return;

    // Información básica
    document.getElementById('foodTitle').textContent = currentFoodData.nombre;
    document.getElementById('foodDescription').textContent = currentFoodData.descripcion;
    document.getElementById('caloriesValue').textContent = currentFoodData.calorias;
    document.getElementById('timeValue').textContent = parseInt(currentFoodData.tiempo) || 20;
    document.getElementById('difficultyValue').textContent = currentFoodData.dificultad;

    // Imagen
    const foodImage = document.getElementById('foodImage');
    foodImage.src = currentFoodData.imagen;
    foodImage.alt = currentFoodData.nombre;
    foodImage.onerror = function() {
        this.src = currentFoodData.imagenFallback || '../../imagenes/comidas.jpg';
    };

    // Categoría
    setCategoryBadge(currentFoodData.categoria);

    // Información nutricional
    populateNutritionData();

    // Ingredientes
    populateIngredients();

    // Preparación
    populatePreparation();

    // Beneficios
    populateBenefits();

    // Comidas relacionadas
    populateRelatedFoods();
}

// Configurar badge de categoría
function setCategoryBadge(categoria) {
    const categoryIcon = document.getElementById('categoryIcon');
    const categoryText = document.getElementById('categoryText');
    
    const categoryMap = {
        'desayuno': { icon: '🌅', text: 'Desayuno' },
        'almuerzo': { icon: '☀️', text: 'Almuerzo' },
        'cena': { icon: '🌙', text: 'Cena' },
        'snack': { icon: '🍎', text: 'Snack' }
    };
    
    const categoryData = categoryMap[categoria] || categoryMap['almuerzo'];
    categoryIcon.textContent = categoryData.icon;
    categoryText.textContent = categoryData.text;
}

// Poblar datos nutricionales
function populateNutritionData() {
    document.getElementById('proteinValue').textContent = `${currentFoodData.proteinas}g`;
    document.getElementById('fatValue').textContent = `${currentFoodData.grasas}g`;
    document.getElementById('carbValue').textContent = `${currentFoodData.carbohidratos}g`;
    document.getElementById('fiberValue').textContent = `${currentFoodData.fibra}g`;
    document.getElementById('sugarValue').textContent = `${currentFoodData.azucar}g`;
    document.getElementById('sodiumValue').textContent = `${currentFoodData.sodio}mg`;
    document.getElementById('totalCalories').textContent = `${currentFoodData.calorias} kcal`;
}

// Poblar ingredientes
function populateIngredients() {
    const ingredientsList = document.getElementById('ingredientsList');
    ingredientsList.innerHTML = '';

    const ingredientIcons = ['🥬', '🥕', '🧄', '🧅', '🫒', '🌿', '🧂', '🔥'];
    
    currentFoodData.ingredientes.forEach((ingrediente, index) => {
        const ingredientItem = document.createElement('div');
        ingredientItem.className = 'ingredient-item';
        ingredientItem.innerHTML = `
            <span class="ingredient-icon">${ingredientIcons[index % ingredientIcons.length]}</span>
            <span class="ingredient-name">${ingrediente}</span>
        `;
        ingredientsList.appendChild(ingredientItem);
    });
}

// Poblar preparación
function populatePreparation() {
    document.getElementById('prepTime').textContent = currentFoodData.tiempo;
    document.getElementById('prepDifficulty').textContent = currentFoodData.dificultad;

    const preparationSteps = document.getElementById('preparationSteps');
    preparationSteps.innerHTML = '';

    // Dividir la preparación en pasos
    const steps = currentFoodData.preparacion.split(/\d+\./).filter(step => step.trim());
    
    steps.forEach((step, index) => {
        const stepItem = document.createElement('div');
        stepItem.className = 'step-item';
        stepItem.innerHTML = `
            <div class="step-number">${index + 1}</div>
            <div class="step-text">${step.trim()}</div>
        `;
        preparationSteps.appendChild(stepItem);
    });
}

// Poblar beneficios
function populateBenefits() {
    const benefitsList = document.getElementById('benefitsList');
    benefitsList.innerHTML = '';

    const benefitIcons = ['💪', '❤️', '🧠', '🦴', '👁️', '🌟', '⚡', '🛡️'];
    
    currentFoodData.beneficios.forEach((beneficio, index) => {
        const benefitItem = document.createElement('div');
        benefitItem.className = 'benefit-item';
        benefitItem.innerHTML = `
            <div class="benefit-icon">${benefitIcons[index % benefitIcons.length]}</div>
            <div class="benefit-title">${beneficio}</div>
            <div class="benefit-description">Contribuye a tu bienestar general y salud óptima.</div>
        `;
        benefitsList.appendChild(benefitItem);
    });
}

// Poblar comidas relacionadas
function populateRelatedFoods() {
    const relatedFoods = document.getElementById('relatedFoods');
    relatedFoods.innerHTML = '';

    const relatedFoodsData = [
        {
            nombre: 'Ensalada César',
            calorias: '320 kcal',
            imagen: '../../imagenes/comidas.jpg'
        },
        {
            nombre: 'Sopa de Vegetales',
            calorias: '180 kcal',
            imagen: '../../imagenes/comidas.jpg'
        },
        {
            nombre: 'Pollo Grillado',
            calorias: '450 kcal',
            imagen: '../../imagenes/carne.jpg'
        }
    ];

    relatedFoodsData.forEach(food => {
        const foodCard = document.createElement('div');
        foodCard.className = 'related-food-card';
        foodCard.onclick = () => {
            // Aquí podrías cargar los datos de esta comida
            console.log('Ver comida relacionada:', food.nombre);
        };
        
        foodCard.innerHTML = `
            <img src="${food.imagen}" alt="${food.nombre}" onerror="this.src='../../imagenes/comidas.jpg'">
            <div class="related-card-content">
                <h4>${food.nombre}</h4>
                <p>${food.calorias}</p>
            </div>
        `;
        relatedFoods.appendChild(foodCard);
    });
}

// Ocultar pantalla de carga
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
}

// Inicializar tabs
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remover clase active de todos los tabs
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            // Agregar clase active al tab clickeado
            this.classList.add('active');

            // Mostrar contenido correspondiente
            const targetTab = this.dataset.tab;
            const targetContent = document.getElementById(targetTab + 'Tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Funciones de acciones
function toggleFavorite() {
    const heartIcon = document.getElementById('heartIcon');
    isFavorite = !isFavorite;
    
    heartIcon.textContent = isFavorite ? '❤️' : '🤍';
    
    // Animación
    heartIcon.style.transform = 'scale(1.3)';
    setTimeout(() => {
        heartIcon.style.transform = 'scale(1)';
    }, 200);

    // Guardar en localStorage
    if (isFavorite) {
        saveFavoriteFood();
    } else {
        removeFavoriteFood();
    }
}

function saveFavoriteFood() {
    let favorites = JSON.parse(localStorage.getItem('favoritesFoods') || '[]');
    if (!favorites.find(f => f.id === currentFoodData.id)) {
        favorites.push(currentFoodData);
        localStorage.setItem('favoritesFoods', JSON.stringify(favorites));
        showNotification('¡Agregado a favoritos!', 'success');
    }
}

function removeFavoriteFood() {
    let favorites = JSON.parse(localStorage.getItem('favoritesFoods') || '[]');
    favorites = favorites.filter(f => f.id !== currentFoodData.id);
    localStorage.setItem('favoritesFoods', JSON.stringify(favorites));
    showNotification('Removido de favoritos', 'info');
}

function addToMealPlan() {
    let mealPlan = JSON.parse(localStorage.getItem('mealPlan') || '[]');
    
    const mealPlanItem = {
        ...currentFoodData,
        dateAdded: new Date().toISOString(),
        plannedFor: 'today'
    };
    
    mealPlan.push(mealPlanItem);
    localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
    
    showNotification('¡Agregado a tu plan de comidas!', 'success');
}

function shareRecipe() {
    if (navigator.share) {
        navigator.share({
            title: currentFoodData.nombre,
            text: currentFoodData.descripcion,
            url: window.location.href
        });
    } else {
        // Fallback: copiar al portapapeles
        const shareText = `${currentFoodData.nombre} - ${currentFoodData.descripcion}\n${window.location.href}`;
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('¡Enlace copiado al portapapeles!', 'success');
        });
    }
}

function findSimilar() {
    // Redirigir a lista de comidas con filtro similar
    const category = currentFoodData.categoria;
    localStorage.setItem('filterCategory', category);
    window.location.href = '../lista-comidas/lista-comidas.html';
}

function createShoppingList() {
    let shoppingList = JSON.parse(localStorage.getItem('shoppingList') || '[]');
    
    currentFoodData.ingredientes.forEach(ingrediente => {
        if (!shoppingList.includes(ingrediente)) {
            shoppingList.push(ingrediente);
        }
    });
    
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    showNotification('¡Lista de compras actualizada!', 'success');
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        z-index: 1000;
        font-weight: 600;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Verificar si ya es favorito al cargar
function checkIfFavorite() {
    const favorites = JSON.parse(localStorage.getItem('favoritesFoods') || '[]');
    isFavorite = favorites.some(f => f.id === currentFoodData.id);
    
    if (isFavorite) {
        document.getElementById('heartIcon').textContent = '❤️';
    }
}

// Ejecutar verificación de favoritos después de cargar los datos
setTimeout(checkIfFavorite, 100);