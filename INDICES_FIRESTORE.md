# 🔍 Índices Compuestos Requeridos en Firestore

## 📋 Resumen

Firestore requiere índices compuestos cuando se usan consultas que combinan `where()` y `orderBy()` en diferentes campos. Este documento lista todos los índices que necesitas crear en tu consola de Firebase.

## 🔗 Acceso a la Consola

**URL de tu proyecto:** https://console.firebase.google.com/u/1/project/salud-5ac61/firestore/databases/-default-/indexes

## 📊 Índices Requeridos

### 1. Colección: `inventario`
**Campos del índice:**
- `cafeteriaId` (Ascending)
- `fechaActualizacion` (Descending)

**Usado en:** `inventoryService.js` - función `obtenerInventario()`

**Enlace directo para crear:**
```
https://console.firebase.google.com/u/1/project/salud-5ac61/firestore/databases/-default-/indexes?create_composite=Ck5wcm9qZWN0cy9zYWx1ZC01YWM2MS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvaW52ZW50YXJpby9pbmRleGVzL18QARoPCgtjYWZldGVyaWFJZBABGhYKEmZlY2hhQWN0dWFsaXphY2lvbhACGgwKCF9fbmFtZV9fEAI
```

### 2. Colección: `menus`
**Campos del índice:**
- `cafeteriaId` (Ascending)
- `fechaCreacion` (Descending)

**Usado en:** `menuService.js` - función `obtenerMenus()`

**Enlace directo para crear:**
```
https://console.firebase.google.com/u/1/project/salud-5ac61/firestore/databases/-default-/indexes?create_composite=Ck5wcm9qZWN0cy9zYWx1ZC01YWM2MS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbWVudXMvaW5kZXhlcy9fEAEaDwoLY2FmZXRlcmlhSWQQARoUChBmZWNoYUNyZWFjaW9uEAIaDAoIX19uYW1lX18QAw
```

### 3. Colección: `menus` (con fechaPublicacion)
**Campos del índice:**
- `cafeteriaId` (Ascending)
- `fechaPublicacion` (Ascending)
- `fechaCreacion` (Descending)

**Usado en:** `menuService.js` - función `obtenerMenusDisponibles()`

**Nota:** Este índice requiere 3 campos. Debes crearlo manualmente en la consola.

## 🛠️ Cómo Crear los Índices

### Opción 1: Usar los Enlaces Directos
1. Haz clic en el enlace proporcionado arriba
2. Inicia sesión con tu cuenta de Google (bchavezos@ucvvirtual.edu.pe)
3. Firebase creará automáticamente el índice con los campos correctos
4. Espera a que el índice se cree (puede tomar unos minutos)

### Opción 2: Crear Manualmente
1. Ve a: https://console.firebase.google.com/u/1/project/salud-5ac61/firestore/databases/-default-/indexes
2. Haz clic en "Create Index"
3. Selecciona la colección
4. Agrega los campos en el orden especificado
5. Selecciona el orden (Ascending/Descending) para cada campo
6. Haz clic en "Create"

## ⚠️ Errores Comunes

Si ves errores como:
- `The query requires an index`
- `Index not found`

Significa que necesitas crear el índice correspondiente. Firebase generalmente proporciona un enlace directo en el mensaje de error que puedes usar.

## ✅ Verificación

Después de crear los índices:

1. Ve a la pestaña "Indexes" en Firestore
2. Verifica que todos los índices estén en estado "Enabled" (verde)
3. Si un índice está en "Building" (amarillo), espera a que termine
4. Prueba las consultas en tu aplicación

## 📝 Notas Importantes

- Los índices pueden tardar varios minutos en crearse
- No puedes usar la aplicación mientras los índices se están creando
- Si cambias la estructura de las consultas, puede que necesites crear nuevos índices
- Los índices ocupan espacio en Firestore, pero son necesarios para el rendimiento

## 🔧 Configuración Actual de Firebase

**Project ID:** salud-5ac61
**Database:** (default)
**Región:** (default)

La configuración en `firebase.js` está correcta y apunta al proyecto correcto.

