# 📸 CÓMO ACTUALIZAR IMÁGENES DE MENÚS

## 🎯 Opción 1: Desde el Administrador (RECOMENDADO)

### Pasos:

1. **Abre el Administrador:**
   ```
   http://localhost:8000/Administrador/admin/admin.html
   ```

2. **Ve a "Gestión de Menús"**

3. **Haz clic en el botón de editar (lápiz naranja)** del menú que quieres actualizar

4. **En el modal que se abre:**
   - Busca la sección "Imagen del Menú"
   - Haz clic en "Subir imagen" o en el campo de archivo
   - Selecciona la imagen que quieres usar (JPG, PNG, etc.)
   - Verás una vista previa de la imagen

5. **Haz clic en "Guardar Menú"**
   - La imagen se subirá a Firebase Storage
   - Se actualizará automáticamente en Firebase Firestore
   - Aparecerá en la pantalla principal

### ✅ Ventajas:
- Fácil y visual
- La imagen se sube automáticamente a Firebase Storage
- Se actualiza inmediatamente

---

## 🎯 Opción 2: Directamente en Firebase Console

### Pasos:

1. **Abre Firebase Console:**
   ```
   https://console.firebase.google.com/project/salud-5ac61/firestore/data
   ```

2. **Ve a la colección "menus"**

3. **Haz clic en el menú que quieres actualizar**

4. **Busca el campo `imagenURL`**

5. **Actualiza la URL:**
   - Puedes usar una URL de internet (ej: `https://ejemplo.com/imagen.jpg`)
   - O una ruta local relativa (ej: `../../imagenes/nombre-imagen.jpg`)

6. **Haz clic en "Actualizar"**

### ⚠️ Nota:
- Si usas una URL de internet, debe ser accesible públicamente
- Si usas una ruta local, la imagen debe estar en la carpeta `Salud/imagenes/`

---

## 📁 Ubicación de Imágenes Locales

Si quieres usar imágenes locales, colócalas en:
```
Salud/imagenes/
```

Y luego usa la ruta relativa:
```
../../imagenes/nombre-imagen.jpg
```

---

## 🔧 Solución Rápida: Actualizar Múltiples Menús

Si quieres actualizar varios menús rápidamente:

1. Prepara las imágenes con nombres descriptivos:
   - `desayuno-energetico.jpg`
   - `pollo-arroz.jpg`
   - `salmon-verduras.jpg`
   - etc.

2. Colócalas en: `Salud/imagenes/`

3. Edita cada menú desde el administrador y sube la imagen correspondiente

---

## 💡 Tipos de Imágenes Recomendadas

- **Formato:** JPG, PNG, WebP
- **Tamaño:** Máximo 2MB por imagen
- **Dimensiones:** 800x600px o similar (se ajustarán automáticamente)
- **Calidad:** Buena calidad pero optimizada para web

---

## ❓ ¿Problemas?

Si la imagen no se sube:
1. Verifica que Firebase Storage esté habilitado
2. Verifica las reglas de Storage (deben permitir escritura)
3. Revisa la consola del navegador (F12) para ver errores
4. Asegúrate de que el servidor local esté corriendo

