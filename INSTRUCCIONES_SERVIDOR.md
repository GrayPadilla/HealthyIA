# 🚀 Cómo Ejecutar el Proyecto con Servidor Local

## ❌ Problema
Si ves este error:
```
Access to script at 'file:///...' from origin 'null' has been blocked by CORS policy
```

Es porque estás abriendo el archivo HTML directamente desde el explorador de archivos. Los módulos ES6 (`import/export`) requieren un servidor web.

## ✅ Solución: Usar un Servidor Local

### Opción 1: Usar Python (Recomendado)

1. **Abre PowerShell o CMD** en la carpeta del proyecto:
   ```
   cd "C:\Users\BRAYAN\Downloads\Healthy IA"
   ```

2. **Ejecuta el servidor:**
   ```bash
   python -m http.server 8000
   ```
   
   O si tienes Python 2:
   ```bash
   python -m SimpleHTTPServer 8000
   ```

3. **Abre tu navegador** y ve a:
   ```
   http://localhost:8000/Salud/Vista/Registrar-login/register-login.html
   ```

### Opción 2: Usar los Scripts Incluidos

**Windows (PowerShell):**
- Doble clic en `servidor-local.ps1`
- O ejecuta: `powershell -ExecutionPolicy Bypass -File servidor-local.ps1`

**Windows (CMD):**
- Doble clic en `servidor-local.bat`

### Opción 3: Usar Live Server (VS Code)

Si usas Visual Studio Code:
1. Instala la extensión "Live Server"
2. Clic derecho en `register-login.html`
3. Selecciona "Open with Live Server"

### Opción 4: Usar Node.js (http-server)

Si tienes Node.js instalado:
```bash
npx http-server -p 8000
```

## 📝 Nota Importante

**NUNCA** abras archivos HTML directamente desde el explorador de archivos cuando usan módulos ES6. Siempre usa un servidor local.

## 🔗 URLs Correctas

Una vez que el servidor esté corriendo:

- **Login/Registro:** http://localhost:8000/Salud/Vista/Registrar-login/register-login.html
- **Página Principal:** http://localhost:8000/Salud/Vista/Principal/principal.html
- **Lista de Comidas:** http://localhost:8000/Salud/Vista/lista-comidas/lista-comidas.html

---

**¿No tienes Python?** Descárgalo de: https://www.python.org/downloads/

