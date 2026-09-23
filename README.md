# Carta digital – Rincón El Sauce Parrilladas

Menú QR con vista pública (por categorías: entradas, parrilladas, tragos,
postres, etc.) y un panel de administración privado en `/admin` para
agregar, editar y eliminar platos con imagen y precio, sin tocar código.

La app se despliega gratis en **Vercel**. Los datos y precios se guardan
en **Firebase** (plan gratuito "Spark") y las fotos de los platos en
**Cloudinary** (plan gratuito, sin tarjeta) — Firebase Storage hoy exige
una cuenta con tarjeta asociada (plan Blaze), así que se evita por
completo.

---

## 1. Crear el proyecto de Firebase (gratis, sin tarjeta)

1. Ve a https://console.firebase.google.com y crea un proyecto nuevo.
2. Dentro del proyecto, entra a **Compilación → Firestore Database** →
   "Crear base de datos" → edición **Standard** → modo **producción** →
   elige una región (ej. `southamerica-east1`).
3. Ve a **Compilación → Authentication → Sign-in method** → habilita
   **Correo electrónico/contraseña**.
4. En **Authentication → Users**, agrega manualmente un usuario (tu correo
   y una contraseña) — esa será la cuenta para entrar a `/admin`. Puedes
   crear una por cada persona que administre el menú.
5. Ve a **Configuración del proyecto → General**, baja a "Tus apps", crea
   una app **Web** (ícono `</>`), y copia los valores que aparecen
   (`apiKey`, `authDomain`, etc.) — los usarás en el paso 4.

### Reglas de seguridad de Firestore

En **Firestore Database → Reglas**, reemplaza por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /items/{itemId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Esto deja la carta visible para cualquiera (los clientes que escanean el
QR) pero solo permite agregar/editar/eliminar platos a quien haya
iniciado sesión en `/admin`.

---

## 2. Crear la cuenta de Cloudinary (gratis, sin tarjeta)

1. Ve a https://cloudinary.com/users/register/free y crea una cuenta.
2. En el **Dashboard**, copia el valor **"Cloud name"** (lo usarás como
   `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`).
3. Ve a **Settings (ícono de tuerca) → Upload** → sección "Upload
   presets" → **"Add upload preset"**.
4. Cambia **"Signing Mode"** de "Signed" a **"Unsigned"** y guarda. Copia
   el nombre del preset (lo usarás como
   `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`).

Con esto, el panel de administración sube las fotos directo desde el
navegador, sin exponer contraseñas ni pedir tarjeta.

---

## 3. Probar en tu computador (opcional)

```bash
npm install
cp .env.local.example .env.local
# pega los valores de Firebase y Cloudinary dentro de .env.local
npm run dev
```

Abre `http://localhost:3000` (carta) y `http://localhost:3000/admin`
(panel).

---

## 4. Desplegar en Vercel (gratis)

1. Sube esta carpeta a un repositorio de GitHub.
2. Entra a https://vercel.com, "Add New… → Project" e importa el
   repositorio.
3. En **Environment Variables**, agrega las mismas variables que dejaste
   en `.env.local.example` (con los valores reales de Firebase y
   Cloudinary).
4. Presiona **Deploy**. En un par de minutos tendrás una URL tipo
   `https://tu-carta.vercel.app`.
5. Genera el código QR apuntando a esa URL (por ejemplo con
   https://www.qr-code-generator.com) e imprímelo para las mesas.

---

## 5. Uso diario

- **Carta pública** (`/`): se actualiza sola en cuanto se guarda un
  cambio en el panel — no hay que volver a desplegar nada.
- **Panel** (`/admin`): inicia sesión con el correo/contraseña creado en
  el paso 1.4, agrega un plato con nombre, descripción, precio, categoría
  e imagen. Si escribes una categoría nueva (por ejemplo "Ensaladas"),
  aparece automáticamente como una nueva sección en la carta.
- Para agregar más administradores, créales un usuario en
  **Authentication → Users** dentro de Firebase.

---

## Estructura del proyecto

```
app/
  page.js            → carta pública
  admin/page.js       → login + panel de administración
components/
  AdminItemForm.js     → formulario agregar/editar plato (sube fotos a Cloudinary)
  AdminItemList.js      → listado con editar/eliminar
lib/
  firebase.js           → conexión a Firestore y Authentication
  format.js              → formato de precios (CLP) y orden de categorías
```
