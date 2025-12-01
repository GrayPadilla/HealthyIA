# 🔧 Verificar Reglas de Firestore

## ⚠️ IMPORTANTE: Las reglas deben estar publicadas en Firebase Console

Aunque el archivo `firestore.rules` tiene las reglas correctas, **DEBES publicarlas en Firebase Console**.

## 📋 Pasos para Verificar/Publicar Reglas:

1. **Ve a Firebase Console:**
   ```
   https://console.firebase.google.com
   ```

2. **Selecciona tu proyecto:**
   - Proyecto: `salud-5ac61`

3. **Ve a Firestore Database:**
   - En el menú lateral, haz clic en "Firestore Database"
   - O ve directamente a: https://console.firebase.google.com/project/salud-5ac61/firestore

4. **Ve a la pestaña "Reglas":**
   - Haz clic en la pestaña "Reglas" en la parte superior

5. **Verifica/Cambia las reglas:**
   Deben ser exactamente así:
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

6. **Publica las reglas:**
   - Haz clic en el botón **"Publicar"** (arriba a la derecha)
   - Espera a que se publique (verás un mensaje de confirmación)

## ✅ Después de Publicar:

1. Recarga la página del administrador (Ctrl+F5)
2. Intenta guardar un menú nuevamente
3. Debería funcionar correctamente

## 🔍 Si Aún No Funciona:

1. **Abre la consola del navegador (F12)**
2. **Intenta guardar un menú**
3. **Copia el error exacto que aparece**
4. **Verifica:**
   - ¿Aparece "permission-denied"?
   - ¿Aparece "unavailable"?
   - ¿Aparece otro error?

## 📝 Nota de Seguridad:

⚠️ **Estas reglas permiten lectura/escritura sin autenticación.**
- ✅ Está bien para desarrollo/pruebas
- ❌ NO es seguro para producción
- 🔒 En producción, deberías usar autenticación

