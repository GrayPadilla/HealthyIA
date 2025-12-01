# 🗺️ Guía de Rutas Correctas para Healthy IA

## ⚠️ IMPORTANTE: Usar Servidor Local

**NUNCA** abras los archivos HTML directamente desde el explorador (`file://`).  
**SIEMPRE** usa un servidor local.

## 🚀 Cómo Iniciar el Servidor

### Opción 1: Python (Recomendado)
```bash
cd "C:\Users\BRAYAN\Downloads\Healthy IA"
python -m http.server 8000
```

### Opción 2: Scripts Incluidos
- **Windows:** Doble clic en `servidor-local.bat`
- **PowerShell:** Ejecuta `servidor-local.ps1`

## 🔗 URLs Correctas (con servidor en puerto 8000)

### Páginas Principales
- **Login/Registro:** 
  ```
  http://localhost:8000/Salud/Vista/Registrar-login/register-login.html
  ```

- **Página Principal:**
  ```
  http://localhost:8000/Salud/Vista/Principal/principal.html
  ```

- **Lista de Comidas (después de login):**
  ```
  http://localhost:8000/Salud/Vista/lista-comidas/lista-comidas.html
  ```

- **Mi Perfil:**
  ```
  http://localhost:8000/Salud/Vista/mi-perfil/mi-perfil.html
  ```

- **Asistente IA:**
  ```
  http://localhost:8000/Salud/Vista/asistente-ia/asistente-ia.html
  ```

- **Opciones IA:**
  ```
  http://localhost:8000/Salud/Vista/IA-opciones/IA-opciones.html
  ```

- **Recomendaciones:**
  ```
  http://localhost:8000/Salud/Vista/recomendaciones/recomendaciones.html
  ```

- **Evaluación de Hábitos:**
  ```
  http://localhost:8000/Salud/Vista/evaluacion-habitos/evaluacion-habitos.html
  ```

## 🔄 Flujo de Redirección

### Después del Registro:
1. Usuario se registra → Se guarda en Firebase
2. Se guarda `usuarioActivo` en localStorage
3. Redirección automática a: `lista-comidas.html`

### Después del Login:
1. Usuario inicia sesión → Se verifica en Firebase
2. Se guarda `usuarioActivo` en localStorage
3. **Si es admin:** Redirección a `Administrador/admin/admin.html`
4. **Si es usuario:** Redirección a `lista-comidas.html`

## 🔍 Verificar que Funciona

1. **Abre la consola del navegador (F12)**
2. **Busca estos mensajes:**
   - ✅ "Todos los elementos encontrados correctamente"
   - ✅ "Botones configurados correctamente"
   - ✅ "Botón darkModeToggle encontrado"
   - 🔍 "Verificando conexión a Firebase..."

3. **Si ves errores de CORS:**
   - Asegúrate de estar usando `http://localhost:8000` (NO `file://`)
   - Verifica que el servidor esté corriendo

4. **Si Firebase no funciona:**
   - Verifica tu conexión a internet
   - Revisa la configuración en `Salud/Controlador/firebase.js`
   - Asegúrate de que las reglas de Firestore permitan lectura/escritura

## 📝 Notas Importantes

- **Rutas relativas vs absolutas:** El código ahora usa rutas absolutas desde la raíz del servidor para evitar problemas
- **Firebase:** Requiere conexión a internet y configuración correcta
- **localStorage:** Se usa para mantener la sesión del usuario activo

## 🐛 Solución de Problemas

### Error: "Access to script blocked by CORS"
**Solución:** Usa un servidor local, NO abras archivos directamente

### Error: "Failed to load resource"
**Solución:** Verifica que todas las rutas sean correctas y que el servidor esté corriendo

### Error: "Firebase: Permission denied"
**Solución:** Revisa las reglas de Firestore en la consola de Firebase

### No redirige después de login/registro
**Solución:** 
1. Abre la consola (F12) y revisa los logs
2. Verifica que la ruta de redirección sea correcta
3. Asegúrate de que `lista-comidas.html` exista en la ruta especificada

---

**¿Necesitas ayuda?** Revisa la consola del navegador (F12) para ver mensajes de error detallados.

