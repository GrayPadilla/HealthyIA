// Funcionalidad para Mi Perfil

document.addEventListener('DOMContentLoaded', function() {
    // 📊 Medir tiempo de carga del perfil
    if (typeof console !== 'undefined' && console.time) {
        console.time("⏱️ Carga Mi Perfil");
    }
    
    const inicializar = () => {
        initializeTabs();
        loadUserData();
        calculateIMC();
        setupFormListeners();
    };
    
    // Verificar si las funciones de métricas están disponibles
    if (typeof medirTiempoFuncion === 'function') {
        medirTiempoFuncion('inicializarMiPerfil', inicializar);
    } else {
        inicializar();
    }
    
    // 📊 Finalizar medición
    if (typeof console !== 'undefined' && console.timeEnd) {
        console.timeEnd("⏱️ Carga Mi Perfil");
    }
});

// Inicializar tabs
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            this.classList.add('active');
            const targetTab = this.dataset.tab;
            const targetContent = document.getElementById(targetTab + 'Tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Cargar datos del usuario
function loadUserData() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Poblar campos si existen datos
    if (userData.firstName) document.getElementById('firstName').value = userData.firstName;
    if (userData.lastName) document.getElementById('lastName').value = userData.lastName;
    if (userData.email) document.getElementById('email').value = userData.email;
    if (userData.phone) document.getElementById('phone').value = userData.phone;
    if (userData.weight) document.getElementById('weight').value = userData.weight;
    if (userData.height) document.getElementById('height').value = userData.height;
    
    // Cargar estado de evaluación de hábitos
    loadEvaluationStatus();
}

// Cargar estado de evaluación de hábitos
async function loadEvaluationStatus() {
    try {
        const userEmail = localStorage.getItem('usuarioActivo');
        if (!userEmail) return;

        const { db } = await import('../firebase.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js');
        
        const docId = userEmail.replace(/[@.]/g, "_");
        const userRef = doc(db, "usuarios", docId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const evaluacion = userData.evaluacionHabitos;
            
            const statusDiv = document.getElementById('evaluationStatus');
            if (statusDiv) {
                if (evaluacion) {
                    statusDiv.innerHTML = `
                        <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; border-left: 4px solid #4caf50;">
                            <h4 style="color: #2e7d32; margin-bottom: 10px;">✅ Evaluación Completada</h4>
                            <p style="color: #555; margin-bottom: 10px;">
                                <strong>Fecha:</strong> ${new Date(evaluacion.fechaEvaluacion).toLocaleDateString()}
                            </p>
                            <p style="color: #555; margin-bottom: 10px;">
                                <strong>Puntuación:</strong> ${evaluacion.puntuacion}/100 puntos
                            </p>
                            <p style="color: #555;">
                                <strong>Nivel:</strong> ${evaluacion.nivel}
                            </p>
                        </div>
                    `;
                } else {
                    statusDiv.innerHTML = `
                        <div style="background: #fff3e0; padding: 20px; border-radius: 10px; border-left: 4px solid #ff9800;">
                            <h4 style="color: #e65100; margin-bottom: 10px;">⚠️ Evaluación Pendiente</h4>
                            <p style="color: #555;">
                                Aún no has completado la evaluación de hábitos alimenticios. 
                                Completa la evaluación para obtener recomendaciones más personalizadas.
                            </p>
                        </div>
                    `;
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar estado de evaluación:', error);
    }
}

// Calcular IMC
function calculateIMC() {
    const weight = document.getElementById('weight');
    const height = document.getElementById('height');
    
    function updateIMC() {
        // 📊 Medir tiempo de cálculo de IMC (si está disponible)
        const calcular = () => {
            const w = parseFloat(weight.value);
            const h = parseFloat(height.value) / 100; // convertir a metros
            
            if (w && h) {
                const imc = (w / (h * h)).toFixed(1);
                document.getElementById('imcValue').textContent = imc;
                
                let category = '';
                let categoryColor = '';
                
                if (imc < 18.5) {
                    category = 'Bajo peso';
                    categoryColor = '#3b82f6';
                } else if (imc < 25) {
                    category = 'Normal';
                    categoryColor = '#16a34a';
                } else if (imc < 30) {
                    category = 'Sobrepeso';
                    categoryColor = '#eab308';
                } else {
                    category = 'Obesidad';
                    categoryColor = '#ef4444';
                }
                
                const categoryElement = document.getElementById('imcCategory');
                categoryElement.textContent = category;
                categoryElement.style.backgroundColor = categoryColor + '33';
                categoryElement.style.color = categoryColor;
            }
        };
        
        if (typeof medirTiempoFuncion === 'function') {
            medirTiempoFuncion('calculateIMC', calcular);
        } else {
            calcular();
        }
    }
    
    weight.addEventListener('input', updateIMC);
    height.addEventListener('input', updateIMC);
    updateIMC(); // Calcular inicial
}

// Configurar listeners de formularios
function setupFormListeners() {
    // Auto-save cuando cambian los campos importantes
    ['weight', 'height', 'targetWeight', 'targetCalories'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', autoSave);
        }
    });
}

// Auto-guardar
function autoSave() {
    const userData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        weight: document.getElementById('weight').value,
        height: document.getElementById('height').value,
        targetWeight: document.getElementById('targetWeight').value,
        targetCalories: document.getElementById('targetCalories').value,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('userData', JSON.stringify(userData));
}

// Funciones de guardado específicas
function savePersonalInfo() {
    autoSave();
    showNotification('✅ Información personal guardada', 'success');
}

function saveHealthInfo() {
    autoSave();
    calculateIMC();
    showNotification('✅ Datos de salud actualizados', 'success');
}

function saveGoals() {
    autoSave();
    showNotification('✅ Objetivos actualizados', 'success');
}

function savePreferences() {
    autoSave();
    showNotification('✅ Preferencias guardadas', 'success');
}

// Cambiar avatar
function changeAvatar() {
    const avatarOptions = [
        '../../imagenes/logo.jpg',
        '../../imagenes/user-avatar.png',
        '../../imagenes/doctor.jpg'
    ];
    
    const currentAvatar = document.getElementById('userAvatar').src;
    const currentIndex = avatarOptions.findIndex(avatar => currentAvatar.includes(avatar));
    const nextIndex = (currentIndex + 1) % avatarOptions.length;
    
    document.getElementById('userAvatar').src = avatarOptions[nextIndex];
    showNotification('📷 Avatar actualizado', 'success');
}

// Funciones de acción
function exportData() {
    const userData = localStorage.getItem('userData');
    const favoritesFoods = localStorage.getItem('favoritesFoods');
    const mealPlan = localStorage.getItem('mealPlan');
    
    const exportData = {
        userData: JSON.parse(userData || '{}'),
        favoritesFoods: JSON.parse(favoritesFoods || '[]'),
        mealPlan: JSON.parse(mealPlan || '[]'),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'healthy-ia-datos.json';
    link.click();
    
    showNotification('📤 Datos exportados exitosamente', 'success');
}

function deleteAccount() {
    const confirmation = confirm('⚠️ ¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.');
    
    if (confirmation) {
        localStorage.clear();
        alert('Tu cuenta ha sido eliminada. Serás redirigido a la página principal.');
        window.location.href = '../Principal/principal.html';
    }
}

// Mostrar notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 10px;
        z-index: 1000;
        font-weight: 600;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}