# 🔧 SOLUCIÓN: Missing or insufficient permissions

## ❌ Error:
```
FirebaseError: Missing or insufficient permissions
permission-denied
```

## 🔍 Causa:
Las reglas de Firestore NO están permitiendo lectura/escritura, o NO están publicadas.

## ✅ SOLUCIÓN INMEDIATA:

### Paso 1: Ve a Firebase Console - Firestore Rules

Abre este enlace directo:
```
https://console.firebase.google.com/project/salud-5ac61/firestore/rules
```

### Paso 2: Reemplaza TODO el contenido con esto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Paso 3: Publica las Reglas

1. Haz clic en el botón **"Publicar"** (arriba a la derecha, botón azul)
2. Espera a que aparezca el mensaje "Reglas publicadas"
3. **ESPERA 30 SEGUNDOS** después de publicar

### Paso 4: Recargar el Administrador

1. Ve a: `http://localhost:8000/Administrador/admin/admin.html`
2. Presiona **Ctrl+F5** (recarga completa)
3. Abre la consola (F12)
4. Deberías ver: "✅ Test de conexión exitoso: X menús encontrados"

## 🔍 Verificar que Funcionó:

1. En la consola deberías ver:
   - ✅ "Test de conexión exitoso: X menús encontrados"
   - ✅ "Menús activos encontrados: X"
   - ✅ "Dashboard actualizado correctamente"

2. El dashboard debería mostrar los números correctos

3. Puedes crear un menú nuevo y debería guardarse

## ⚠️ IMPORTANTE:

**Estas reglas permiten acceso completo (solo para desarrollo):**
- ✅ Permite lectura/escritura sin autenticación
- ✅ Está bien para desarrollo/pruebas
- ❌ NO es seguro para producción

## 🆘 Si Aún No Funciona:

1. Verifica que estés en el proyecto correcto: **salud-5ac61**
2. Verifica que las reglas estén exactamente como se muestra arriba
3. Verifica que hayas hecho clic en "Publicar"
4. Espera 30 segundos después de publicar
5. Recarga la página (Ctrl+F5)

---

**💡 Después de publicar las reglas, recarga el administrador y debería funcionar.**

