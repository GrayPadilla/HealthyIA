# 🔐 Guía de Acceso al Administrador

## ⚠️ IMPORTANTE: Pasos para Acceder al Administrador

### Paso 1: Iniciar el Servidor Local

**Opción A: Usar el script .bat (Más fácil)**
1. Ve a la carpeta del proyecto: `C:\Users\BRAYAN\Downloads\Healthy IA`
2. Haz **doble clic** en el archivo `servidor-local.bat`
3. Se abrirá una ventana negra (CMD) que dice "Serving HTTP on 0.0.0.0 port 8000"
4. **NO CIERRES** esa ventana, déjala abierta

**Opción B: Usar PowerShell**
1. Abre PowerShell
2. Ejecuta estos comandos:
   ```powershell
   cd "C:\Users\BRAYAN\Downloads\Healthy IA"
   python -m http.server 8000
   ```

**Opción C: Usar el script .ps1**
1. Haz clic derecho en `servidor-local.ps1`
2. Selecciona "Ejecutar con PowerShell"
3. Si te pide permisos, escribe `Y` y presiona Enter

### Paso 2: Verificar que el Servidor Está Corriendo

Deberías ver un mensaje como:
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

### Paso 3: Abrir el Administrador

Abre tu navegador (Chrome, Edge, Firefox) y ve a:

```
http://localhost:8000/Administrador/admin/admin.html
```

**O también puedes probar:**
```
http://127.0.0.1:8000/Administrador/admin/admin.html
```

## 🔍 Solución de Problemas

### ❌ Error: "No se puede acceder a este sitio"
**Causa:** El servidor no está corriendo
**Solución:** 
1. Verifica que ejecutaste el script `servidor-local.bat`
2. Verifica que la ventana CMD/PowerShell sigue abierta
3. Verifica que no hay otro programa usando el puerto 8000

### ❌ Error: "404 Not Found"
**Causa:** La ruta está incorrecta
**Solución:**
1. Verifica que estás en la carpeta correcta: `C:\Users\BRAYAN\Downloads\Healthy IA`
2. Verifica que el archivo existe: `Administrador\admin\admin.html`
3. Prueba esta ruta exacta: `http://localhost:8000/Administrador/admin/admin.html`

### ❌ Error: "CORS policy" o errores de módulos
**Causa:** Estás abriendo el archivo directamente (file://)
**Solución:** SIEMPRE usa el servidor local, NUNCA abras el archivo directamente

### ❌ El puerto 8000 está ocupado
**Solución:** Usa otro puerto:
```bash
python -m http.server 8080
```
Y luego accede a: `http://localhost:8080/Administrador/admin/admin.html`

## ✅ Verificación Rápida

1. ¿El servidor está corriendo? → Deberías ver una ventana CMD/PowerShell abierta
2. ¿Puedes acceder a `http://localhost:8000`? → Deberías ver un listado de archivos
3. ¿El archivo existe? → Verifica en: `Administrador\admin\admin.html`

## 📝 Rutas Completas

- **Administrador:** `http://localhost:8000/Administrador/admin/admin.html`
- **Página Principal:** `http://localhost:8000/Salud/Vista/Principal/principal.html`
- **Login:** `http://localhost:8000/Salud/Vista/Registrar-login/register-login.html`

## 🆘 Si Nada Funciona

1. Cierra todas las ventanas del servidor
2. Abre una nueva ventana CMD o PowerShell
3. Ve a la carpeta del proyecto
4. Ejecuta: `python -m http.server 8000`
5. Abre el navegador y ve a: `http://localhost:8000/Administrador/admin/admin.html`

