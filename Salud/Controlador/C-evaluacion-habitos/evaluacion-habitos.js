import { db } from "../firebase.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

let currentQuestion = 1;
const totalQuestions = 10;
const answers = {};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('evaluationForm');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const submitBtn = document.getElementById('submitBtn');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  // Mostrar primera pregunta
  showQuestion(1);

  // Botón Siguiente
  nextBtn.addEventListener('click', () => {
    if (validateCurrentQuestion()) {
      if (currentQuestion < totalQuestions) {
        currentQuestion++;
        showQuestion(currentQuestion);
        updateProgress();
      }
    } else {
      alert('Por favor, selecciona una opción antes de continuar.');
    }
  });

  // Botón Anterior
  prevBtn.addEventListener('click', () => {
    if (currentQuestion > 1) {
      currentQuestion--;
      showQuestion(currentQuestion);
      updateProgress();
    }
  });

  // Guardar respuesta cuando se selecciona una opción
  form.addEventListener('change', (e) => {
    if (e.target.type === 'radio') {
      const questionName = e.target.name;
      answers[questionName] = e.target.value;
    }
  });

  // Enviar formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validateCurrentQuestion()) {
      await saveEvaluationResults();
    } else {
      alert('Por favor, selecciona una opción antes de finalizar.');
    }
  });
});

function showQuestion(questionNum) {
  // Ocultar todas las preguntas
  document.querySelectorAll('.question-card').forEach(card => {
    card.classList.remove('active');
  });

  // Mostrar pregunta actual
  const currentCard = document.querySelector(`[data-question="${questionNum}"]`);
  if (currentCard) {
    currentCard.classList.add('active');
  }

  // Restaurar respuesta guardada si existe
  const questionName = currentCard.querySelector('input[type="radio"]')?.name;
  if (questionName && answers[questionName]) {
    const savedAnswer = answers[questionName];
    const radio = currentCard.querySelector(`input[value="${savedAnswer}"]`);
    if (radio) {
      radio.checked = true;
    }
  }

  // Actualizar botones
  updateButtons();
}

function updateButtons() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');

  // Mostrar/ocultar botón anterior
  if (currentQuestion === 1) {
    prevBtn.style.display = 'none';
  } else {
    prevBtn.style.display = 'block';
  }

  // Mostrar/ocultar botones siguiente/finalizar
  if (currentQuestion === totalQuestions) {
    nextBtn.style.display = 'none';
    submitBtn.style.display = 'block';
  } else {
    nextBtn.style.display = 'block';
    submitBtn.style.display = 'none';
  }
}

function updateProgress() {
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const percentage = (currentQuestion / totalQuestions) * 100;
  
  progressFill.style.width = `${percentage}%`;
  progressText.textContent = `Pregunta ${currentQuestion} de ${totalQuestions}`;
}

function validateCurrentQuestion() {
  const currentCard = document.querySelector(`[data-question="${currentQuestion}"]`);
  const selected = currentCard.querySelector('input[type="radio"]:checked');
  return selected !== null;
}

async function saveEvaluationResults() {
  try {
    // Obtener email del usuario activo
    const userEmail = localStorage.getItem('usuarioActivo');
    if (!userEmail) {
      alert('Por favor, inicia sesión para guardar tu evaluación.');
      window.location.href = '../Registrar-login/register-login.html';
      return;
    }

    // Calcular puntuación y análisis
    const analysis = analyzeAnswers(answers);

    // Guardar en Firestore
    const docId = userEmail.replace(/[@.]/g, "_");
    const userRef = doc(db, "usuarios", docId);
    
    // Obtener datos existentes del usuario
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};

    // Actualizar con evaluación de hábitos
    await setDoc(userRef, {
      ...userData,
      evaluacionHabitos: {
        respuestas: answers,
        fechaEvaluacion: new Date().toISOString(),
        puntuacion: analysis.puntuacion,
        nivel: analysis.nivel,
        recomendaciones: analysis.recomendaciones
      }
    }, { merge: true });

    // Mostrar resultados
    showResults(analysis);

  } catch (error) {
    console.error('Error al guardar evaluación:', error);
    alert('Error al guardar la evaluación. Por favor, intenta de nuevo.');
  }
}

function analyzeAnswers(answers) {
  let puntuacion = 0;
  const recomendaciones = [];

  // Análisis de frecuencia de comidas
  if (answers.frecuenciaComidas === '4' || answers.frecuenciaComidas === '5') {
    puntuacion += 10;
  } else if (answers.frecuenciaComidas === '3') {
    puntuacion += 7;
  } else {
    puntuacion += 3;
    recomendaciones.push('Intenta realizar 4-5 comidas al día para mantener tu metabolismo activo.');
  }

  // Análisis de desayuno
  if (answers.horarioDesayuno === '7-9') {
    puntuacion += 10;
  } else if (answers.horarioDesayuno === '9-11') {
    puntuacion += 7;
  } else if (answers.horarioDesayuno === 'no-desayuno') {
    puntuacion += 2;
    recomendaciones.push('El desayuno es importante para iniciar el día con energía. Intenta desayunar entre las 7-9 AM.');
  }

  // Análisis de consumo de agua
  if (answers.consumoAgua === '7-9' || answers.consumoAgua === 'mas-9') {
    puntuacion += 10;
  } else if (answers.consumoAgua === '4-6') {
    puntuacion += 7;
  } else {
    puntuacion += 3;
    recomendaciones.push('Intenta beber al menos 7-8 vasos de agua al día para mantenerte hidratado.');
  }

  // Análisis de frutas y verduras
  if (answers.frutasVerduras === 'mas-5' || answers.frutasVerduras === '4-5') {
    puntuacion += 10;
  } else if (answers.frutasVerduras === '2-3') {
    puntuacion += 6;
  } else {
    puntuacion += 2;
    recomendaciones.push('Aumenta tu consumo de frutas y verduras. Intenta consumir al menos 5 porciones al día.');
  }

  // Análisis de proteínas
  if (answers.consumoProteinas === 'diario' || answers.consumoProteinas === '4-6') {
    puntuacion += 10;
  } else if (answers.consumoProteinas === '2-3') {
    puntuacion += 6;
  } else {
    puntuacion += 3;
    recomendaciones.push('Aumenta tu consumo de proteínas. Intenta incluir proteínas en al menos 4-5 comidas por semana.');
  }

  // Análisis de alimentos procesados
  if (answers.alimentosProcesados === 'rara-vez') {
    puntuacion += 10;
  } else if (answers.alimentosProcesados === '1-2') {
    puntuacion += 7;
  } else {
    puntuacion += 3;
    recomendaciones.push('Reduce el consumo de alimentos procesados. Intenta preparar comidas caseras más frecuentemente.');
  }

  // Análisis de actividad física
  if (answers.actividadFisica === '5-mas') {
    puntuacion += 10;
  } else if (answers.actividadFisica === '3-4') {
    puntuacion += 8;
  } else if (answers.actividadFisica === '1-2') {
    puntuacion += 5;
  } else {
    puntuacion += 2;
    recomendaciones.push('Intenta realizar actividad física al menos 3 veces por semana para mejorar tu salud general.');
  }

  // Determinar nivel
  let nivel = '';
  if (puntuacion >= 80) {
    nivel = 'Excelente';
  } else if (puntuacion >= 60) {
    nivel = 'Bueno';
  } else if (puntuacion >= 40) {
    nivel = 'Regular';
  } else {
    nivel = 'Necesita Mejora';
  }

  return {
    puntuacion,
    nivel,
    recomendaciones: recomendaciones.length > 0 ? recomendaciones : ['¡Mantén tus buenos hábitos!']
  };
}

function showResults(analysis) {
  const form = document.getElementById('evaluationForm');
  const resultsSection = document.getElementById('resultsSection');
  const resultsContent = document.getElementById('resultsContent');

  // Ocultar formulario
  form.style.display = 'none';

  // Mostrar resultados
  resultsSection.style.display = 'block';

  // Generar contenido de resultados
  resultsContent.innerHTML = `
    <div class="result-item">
      <h4>📊 Puntuación General</h4>
      <p><strong>${analysis.puntuacion}/100 puntos</strong> - Nivel: <strong>${analysis.nivel}</strong></p>
    </div>
    <div class="result-item">
      <h4>💡 Recomendaciones Personalizadas</h4>
      <ul style="list-style: none; padding: 0;">
        ${analysis.recomendaciones.map(rec => `<li style="margin-bottom: 10px; padding-left: 20px; position: relative;">
          <span style="position: absolute; left: 0;">✓</span> ${rec}
        </li>`).join('')}
      </ul>
    </div>
    <div class="result-item">
      <h4>📝 Próximos Pasos</h4>
      <p>Basado en tu evaluación, hemos guardado tus respuestas en tu perfil. Ahora puedes ver recomendaciones personalizadas de menús que se adaptan a tus hábitos alimenticios.</p>
    </div>
  `;

  // Scroll a resultados
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

