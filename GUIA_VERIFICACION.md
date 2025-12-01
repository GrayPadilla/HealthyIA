# 📋 Guía de Verificación - Requerimientos Implementados

Esta guía te ayudará a verificar que todos los requerimientos están correctamente implementados en el proyecto Healthy IA.

---

## ✅ Requerimiento 1: Registro de Perfil de Usuario

### Verificación:

1. **Abrir la página de registro:**
   - Navega a: `Salud/Vista/Registrar-login/register-login.html`
   - Haz clic en el botón "REGÍSTRATE"

2. **Verificar campos básicos:**
   - ✅ Email
   - ✅ Contraseña
   - ✅ Confirmar contraseña
   - ✅ Edad
   - ✅ Género
   - ✅ Altura (cm)
   - ✅ Peso (kg)

3. **Verificar nuevos campos:**
   - ✅ **Tipo de Dieta** (dropdown con opciones: Omnívora, Vegetariana, Vegana, Keto, Paleo, Sin restricción)
   - ✅ **Alergias o Restricciones** (campo de texto opcional)

4. **Probar registro:**
   - Completa todos los campos
   - Selecciona un tipo de dieta
   - Ingresa algunas restricciones (ej: "Gluten, Lactosa")
   - Haz clic en "Registrarse"

5. **Verificar en Firestore:**
   - Abre Firebase Console
   - Ve a Firestore Database
   - Busca la colección "usuarios"
   - Verifica que el nuevo usuario tenga los campos:
     - `preferenciaDieta`
     - `restricciones` (array)

**✅ Estado:** COMPLETO si todos los campos se guardan correctamente en Firestore.

---

## ✅ Requerimiento 2: Evaluación de Hábitos Alimenticios

### Verificación:

1. **Acceder a la evaluación:**
   - Navega a: `Salud/Vista/evaluacion-habitos/evaluacion-habitos.html`
   - O desde el perfil del usuario (si agregaste el enlace)

2. **Verificar interfaz:**
   - ✅ Barra de progreso visible
   - ✅ Pregunta 1 de 10 visible
   - ✅ Botón "Siguiente →" visible
   - ✅ Botón "Anterior" oculto (en la primera pregunta)

3. **Probar flujo de preguntas:**
   - Responde la pregunta 1 (Frecuencia de comidas)
   - Haz clic en "Siguiente"
   - Verifica que aparezca la pregunta 2
   - Verifica que la barra de progreso se actualice
   - Verifica que el botón "Anterior" aparezca
   - Navega por todas las 10 preguntas

4. **Verificar preguntas:**
   - ✅ Pregunta 1: Frecuencia de comidas
   - ✅ Pregunta 2: Horario de desayuno
   - ✅ Pregunta 3: Consumo de agua
   - ✅ Pregunta 4: Frutas y verduras
   - ✅ Pregunta 5: Consumo de proteínas
   - ✅ Pregunta 6: Alimentos procesados
   - ✅ Pregunta 7: Actividad física
   - ✅ Pregunta 8: Objetivo nutricional
   - ✅ Pregunta 9: Nivel de cocina
   - ✅ Pregunta 10: Tiempo disponible

5. **Finalizar evaluación:**
   - Responde la última pregunta
   - Haz clic en "Finalizar Evaluación"
   - Verifica que aparezca la sección de resultados

6. **Verificar resultados:**
   - ✅ Puntuación general (0-100)
   - ✅ Nivel (Excelente, Bueno, Regular, Necesita Mejora)
   - ✅ Recomendaciones personalizadas
   - ✅ Botones para ver recomendaciones o ir al perfil

7. **Verificar en Firestore:**
   - Abre Firebase Console
   - Ve a la colección "usuarios"
   - Busca tu usuario
   - Verifica que exista el campo `evaluacionHabitos` con:
     - `respuestas` (objeto con todas las respuestas)
     - `fechaEvaluacion`
     - `puntuacion`
     - `nivel`
     - `recomendaciones`

**✅ Estado:** COMPLETO si la evaluación funciona correctamente y se guarda en Firestore.

---

## ✅ Requerimiento 3: Motor de IA para Recomendaciones Personalizadas

### Verificación:

1. **Asegúrate de tener:**
   - ✅ Un usuario registrado con perfil completo
   - ✅ Evaluación de hábitos completada (opcional pero recomendado)

2. **Acceder a recomendaciones:**
   - Navega a: `Salud/Vista/recomendaciones/recomendaciones.html`
   - O haz clic en "Ver Recomendaciones" desde la evaluación

3. **Generar recomendaciones:**
   - Haz clic en el botón "🔄 Generar Nuevas Recomendaciones"
   - Espera a que se complete el análisis (verás un mensaje de carga)

4. **Verificar análisis nutricional:**
   - El sistema debe calcular:
     - ✅ Calorías diarias recomendadas (basadas en Harris-Benedict)
     - ✅ Proteínas (gramos)
     - ✅ Carbohidratos (gramos)
     - ✅ Grasas (gramos)

5. **Verificar recomendaciones:**
   - ✅ Menús recomendados ordenados por porcentaje de match
   - ✅ Cada menú muestra:
     - Nombre
     - Descripción
     - Calorías
     - Porcentaje de match con tu perfil

6. **Verificar personalización:**
   - Las recomendaciones deben considerar:
     - ✅ Tu IMC y categoría
     - ✅ Tu objetivo nutricional
     - ✅ Tu preferencia dietética
     - ✅ Tus restricciones/alergias
     - ✅ Tu nivel de actividad física

7. **Probar con diferentes perfiles:**
   - Crea un usuario con objetivo "perder-peso"
   - Genera recomendaciones
   - Verifica que las calorías sean menores
   - Crea otro usuario con objetivo "ganar-musculo"
   - Verifica que las proteínas sean mayores

8. **Verificar en consola del navegador:**
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña "Console"
   - No debe haber errores relacionados con `recommendationEngine.js`

**✅ Estado:** COMPLETO si las recomendaciones se generan correctamente y son personalizadas según el perfil.

---

## 🔍 Verificación Adicional

### Verificar integración entre módulos:

1. **Flujo completo:**
   - Registro → Evaluación → Recomendaciones
   - Verifica que los datos fluyan correctamente entre módulos

2. **Verificar localStorage:**
   - Abre las herramientas de desarrollador (F12)
   - Ve a "Application" → "Local Storage"
   - Verifica que se guarde:
     - `usuarioActivo` (email del usuario)
     - `recomendacionesActuales` (objeto JSON con recomendaciones)

3. **Verificar errores:**
   - Abre la consola del navegador
   - Navega por todas las páginas
   - No debe haber errores críticos en rojo

---

## 📝 Checklist de Verificación Rápida

Marca cada ítem cuando lo hayas verificado:

### Requerimiento 1:
- [ ] Campos de preferencias y restricciones visibles en registro
- [ ] Datos se guardan en Firestore correctamente
- [ ] Puedo ver los datos guardados en la consola de Firebase

### Requerimiento 2:
- [ ] Puedo acceder a la página de evaluación
- [ ] Puedo navegar por las 10 preguntas
- [ ] La barra de progreso funciona correctamente
- [ ] Los resultados se muestran al finalizar
- [ ] Los datos se guardan en Firestore

### Requerimiento 3:
- [ ] Puedo generar recomendaciones personalizadas
- [ ] Se calculan las necesidades calóricas correctamente
- [ ] Se calculan los macronutrientes
- [ ] Los menús se ordenan por porcentaje de match
- [ ] Las recomendaciones consideran mi perfil

---

## 🐛 Solución de Problemas

### Si el registro no guarda preferencias:
- Verifica que el formulario tenga los campos `preferenciaDieta` y `restricciones`
- Revisa la consola del navegador para errores
- Verifica que Firebase esté configurado correctamente

### Si la evaluación no funciona:
- Verifica que el archivo `evaluacion-habitos.js` esté cargado
- Revisa que Firebase esté configurado
- Verifica que el usuario esté logueado (localStorage tiene `usuarioActivo`)

### Si las recomendaciones no se generan:
- Verifica que el usuario tenga datos completos (peso, altura, edad)
- Revisa la consola para errores
- Verifica que el archivo `recommendationEngine.js` esté importado correctamente
- Asegúrate de que existan menús en Firestore en la colección "menus"

---

## 📊 Archivos Creados/Modificados

### Nuevos archivos:
1. `Salud/Vista/evaluacion-habitos/evaluacion-habitos.html`
2. `Salud/Vista/evaluacion-habitos/evaluacion-habitos.css`
3. `Salud/Controlador/C-evaluacion-habitos/evaluacion-habitos.js`
4. `Salud/Controlador/services/recommendationEngine.js`

### Archivos modificados:
1. `Salud/Vista/Registrar-login/register-login.html` (agregados campos de preferencias)
2. `Salud/Vista/Registrar-login/register-login.css` (estilos para nuevos campos)
3. `Salud/Controlador/C-Registrar-login/register-login.js` (lógica para guardar preferencias)
4. `Salud/Controlador/C-recomendaciones/recomendaciones.js` (integración con motor de IA)

---

## ✅ Conclusión

Si todos los puntos de verificación están completos, entonces los 3 requerimientos faltantes han sido implementados exitosamente. El proyecto ahora tiene **100% de cumplimiento** de los 8 requerimientos principales.

**Fecha de verificación:** _______________

**Verificado por:** _______________

---

**Nota:** Si encuentras algún problema durante la verificación, revisa la consola del navegador y los logs de Firebase para más detalles sobre los errores.

