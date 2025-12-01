import { obtenerMenusRecomendados, analizarPerfilUsuario } from '../services/recommendationEngine.js';

function verDetalle(foodId) {
    window.location.href = `../comida-detalle/comida-detalle.html?food=${foodId}`;
}

async function generateNewRecommendations() {
    try {
        const userEmail = localStorage.getItem('usuarioActivo');
        if (!userEmail) {
            alert('Por favor, inicia sesión para ver recomendaciones personalizadas.');
            window.location.href = '../Registrar-login/register-login.html';
            return;
        }

        // Mostrar indicador de carga
        const loadingMsg = document.createElement('div');
        loadingMsg.innerHTML = '🔄 Analizando tu perfil y generando recomendaciones personalizadas...';
        loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10000;';
        document.body.appendChild(loadingMsg);

        // Obtener recomendaciones
        const resultado = await obtenerMenusRecomendados(userEmail);
        
        // Remover indicador de carga
        document.body.removeChild(loadingMsg);

        // Guardar recomendaciones en localStorage
        localStorage.setItem('recomendacionesActuales', JSON.stringify(resultado));

        // Actualizar la página con las nuevas recomendaciones
        actualizarRecomendacionesEnPagina(resultado);

        alert('✅ Recomendaciones generadas exitosamente basadas en tu perfil!');
    } catch (error) {
        console.error('Error al generar recomendaciones:', error);
        alert('Error al generar recomendaciones. Por favor, intenta de nuevo.');
    }
}

function actualizarRecomendacionesEnPagina(resultado) {
    // Actualizar sección de análisis nutricional si existe
    const analisisSection = document.getElementById('analisisNutricional');
    if (analisisSection && resultado.analisis) {
        const analisis = resultado.analisis;
        analisisSection.innerHTML = `
            <h3>📊 Tu Análisis Nutricional</h3>
            <div class="analisis-item">
                <strong>Calorías diarias recomendadas:</strong> ${analisis.necesidadesNutricionales.calorias} kcal
            </div>
            <div class="analisis-item">
                <strong>Proteínas:</strong> ${analisis.necesidadesNutricionales.macronutrientes.proteinas}g
            </div>
            <div class="analisis-item">
                <strong>Carbohidratos:</strong> ${analisis.necesidadesNutricionales.macronutrientes.carbohidratos}g
            </div>
            <div class="analisis-item">
                <strong>Grasas:</strong> ${analisis.necesidadesNutricionales.macronutrientes.grasas}g
            </div>
        `;
    }

    // Actualizar menús recomendados si existe la sección
    const menusSection = document.getElementById('menusRecomendados');
    if (menusSection && resultado.menusRecomendados) {
        menusSection.innerHTML = resultado.menusRecomendados.map((menu, index) => `
            <div class="menu-recomendado" onclick="verDetalle('${menu.id}')">
                <h4>${menu.nombre || 'Menú'}</h4>
                <p>${menu.descripcion || ''}</p>
                <div class="menu-stats">
                    <span>🔥 ${menu.calorias || 0} kcal</span>
                    <span>⭐ ${menu.porcentajeMatch}% match</span>
                </div>
            </div>
        `).join('');
    }
}

// Cargar recomendaciones al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    const userEmail = localStorage.getItem('usuarioActivo');
    if (userEmail) {
        try {
            const recomendacionesGuardadas = localStorage.getItem('recomendacionesActuales');
            if (recomendacionesGuardadas) {
                const resultado = JSON.parse(recomendacionesGuardadas);
                actualizarRecomendacionesEnPagina(resultado);
            } else {
                // Generar recomendaciones si no hay guardadas
                await generateNewRecommendations();
            }
        } catch (error) {
            console.error('Error al cargar recomendaciones:', error);
        }
    }
});
    
function viewAllFoods() {
    window.location.href = '../lista-comidas/lista-comidas.html';
}