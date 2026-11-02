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
    match /promos/{promoId} {
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
  Debajo del carrusel está el selector **Elige tu categoría**, enmarcado y
  con la categoría seleccionada en dorado. Una lupa circular fija en la
  esquina inferior izquierda abre el buscador, que filtra
  por nombre, descripción o categoría sin distinguir mayúsculas ni tildes;
  solo busca platos visibles. Puedes limpiar el campo o cerrar el buscador
  con su botón de cierre o Escape para volver a ver todos los platos.
  Los títulos de categoría conservan el estilo original con llama y línea de brasa.
  Al dejar atrás las categorías aparece **Volver al inicio** abajo a la derecha,
  que regresa a ese punto de la carta. El carrusel utiliza puntos como
  indicadores, con avance automático y sin flechas sobre las imágenes.
- **Panel** (`/admin`): inicia sesión con el correo/contraseña creado en
  el paso 1.4. Tiene dos pestañas:
  - **Platos**: agrega/edita/elimina platos (nombre, descripción, precio,
    categoría, imagen). Si escribes una categoría nueva (por ejemplo
    "Ensaladas"), aparece automáticamente como una nueva sección en la
    carta. Cada plato tiene un botón **"Ocultar"** para sacarlo
    momentáneamente de la carta pública sin borrarlo — útil para platos
    de temporada o de una ocasión especial. "Mostrar" lo vuelve a activar.
  - **Promociones y eventos**: usa **Agregar publicación** para crear una
    oferta, evento o novedad con título, descripción e imagen opcional.
    Revisa la vista previa antes de guardar. El carrusel mantiene su tamaño
    al cambiar de publicación: las imágenes se ajustan completas a un espacio
    de proporción fija, sin recortarse ni mover los platos de la carta. Se admiten
    JPG, PNG, WebP, AVIF y GIF de hasta 10 MB; las imágenes se suben al guardar.
    El carrusel aparece sobre los platos cuando hay publicaciones visibles.
    Las imágenes difuminan sus bordes con el fondo, manteniendo el centro nítido.
    Tiene indicadores, teclado y deslizamiento
    en celular. Avanza automáticamente cada 6,5 segundos, también después
    de elegir un indicador o deslizar. El gesto en curso, salir de pantalla o
    cambiar de pestaña suspenden temporalmente el avance; respeta la
    preferencia de movimiento reducido del dispositivo.
    El botón **Ocultar/Mostrar** controla la visibilidad sin borrar publicaciones.
    Las promociones existentes siguen funcionando y muestran la imagen completa.
- Para agregar más administradores, créales un usuario en
  **Authentication → Users** dentro de Firebase.

Nota: si ya tenías el proyecto desplegado antes de esta versión, solo
necesitas actualizar las reglas de Firestore (sección de arriba, ahora
incluyen `promos`) y volver a desplegar — no hace falta tocar nada más
en Firebase ni Cloudinary.

---

## Estructura del proyecto

```
app/
  page.js            → carta pública (incluye el carrusel de promociones)
  admin/page.js       → login + panel de administración (pestañas Platos / Promociones)
components/
  AdminItemForm.js     → formulario agregar/editar plato (sube fotos a Cloudinary)
  AdminItemList.js      → listado de platos, con ocultar/editar/eliminar
  AdminPromoForm.js      → formulario agregar/editar promoción o evento
  AdminPromoList.js       → listado de promociones, con ocultar/editar/eliminar
  PromoCarousel.js         → carrusel público de promociones/eventos
  PromoCard.js              → imagen y texto compartidos con la vista previa
  FlameIcon.js              → ícono de marca reutilizado en toda la app
lib/
  firebase.js           → conexión a Firestore y Authentication
  cloudinary.js           → subida de imágenes a Cloudinary
  format.js                → formato de precios (CLP) y orden de categorías
  promotions.js            → tipos de publicación y presentación de imágenes
```
