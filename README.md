# Carta digital – Rincón El Sauce Parrilladas

Menú QR con vista pública (por categorías: entradas, parrilladas, tragos,
postres, etc.) y un panel de administración privado en `/admin` para
agregar, editar y eliminar platos con imagen y precio, sin tocar código.

La app se despliega gratis en **Vercel**. Los datos (platos, precios,
imágenes) se guardan en **Firebase** (plan gratuito "Spark", más que
suficiente para un menú de restaurant).

---

## 1. Crear el proyecto de Firebase (gratis)

1. Ve a https://console.firebase.google.com y crea un proyecto nuevo.
2. Dentro del proyecto, entra a **Compilación → Firestore Database** →
   "Crear base de datos" → modo **producción** → elige una región (ej.
   `southamerica-east1`).
3. Ve a **Compilación → Storage** → "Comenzar" → misma región. Aquí se
   guardarán las fotos de los platos.
4. Ve a **Compilación → Authentication → Sign-in method** → habilita
   **Correo electrónico/contraseña**.
5. En **Authentication → Users**, agrega manualmente un usuario (tu correo
   y una contraseña) — esa será la cuenta para entrar a `/admin`. Puedes
   crear una por cada persona que administre el menú.
6. Ve a **Configuración del proyecto → General**, baja a "Tus apps", crea
   una app **Web** (ícono `</>`), y copia los valores que aparecen
   (`apiKey`, `authDomain`, etc.) — los usarás en el paso 3.

### Reglas de seguridad

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

En **Storage → Reglas**, reemplaza por:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /menu-images/{allPaths=**} {
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

## 2. Probar en tu computador (opcional)

```bash
npm install
cp .env.local.example .env.local
# pega los valores de Firebase dentro de .env.local
npm run dev
```

Abre `http://localhost:3000` (carta) y `http://localhost:3000/admin`
(panel).

---

## 3. Desplegar en Vercel (gratis)

1. Sube esta carpeta a un repositorio de GitHub.
2. Entra a https://vercel.com, "Add New… → Project" e importa el
   repositorio.
3. En **Environment Variables**, agrega las mismas variables que dejaste
   en `.env.local.example` (con los valores reales de tu proyecto
   Firebase).
4. Presiona **Deploy**. En un par de minutos tendrás una URL tipo
   `https://tu-carta.vercel.app`.
5. Genera el código QR apuntando a esa URL (por ejemplo con
   https://www.qr-code-generator.com) e imprímelo para las mesas.

---

## 4. Uso diario

- **Carta pública** (`/`): se actualiza sola en cuanto se guarda un
  cambio en el panel — no hay que volver a desplegar nada.
- **Panel** (`/admin`): inicia sesión con el correo/contraseña creado en
  el paso 1.5, agrega un plato con nombre, descripción, precio, categoría
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
  AdminItemForm.js     → formulario agregar/editar plato
  AdminItemList.js      → listado con editar/eliminar
lib/
  firebase.js           → conexión a Firebase
  format.js              → formato de precios (CLP) y orden de categorías
```
