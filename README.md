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
    match /categoryImages/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /settings/{settingId} {
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
  el paso 1.4. Tiene dos pestañas:
  - **Platos**: agrega/edita/elimina platos, y con las flechas ▲▼ de
    cada fila ordenas los platos dentro de su categoría a tu gusto (nombre, descripción, precio,
    categoría, imagen). Si escribes una categoría nueva (por ejemplo
    "Ensaladas"), aparece automáticamente como una nueva sección en la
    carta. Cada plato tiene un botón **"Ocultar"** para sacarlo
    momentáneamente de la carta pública sin borrarlo — útil para platos
    de temporada o de una ocasión especial. "Mostrar" lo vuelve a activar.
  - **Promociones y eventos**: título, descripción e imagen opcional.
    Aparecen como un carrusel arriba de la carta pública (2x1, cumpleaños,
    partidos, fiestas patrias, etc.). El botón "Ocultar/Mostrar" controla
    si están visibles sin necesidad de borrarlas. El editor muestra una
    vista previa en escritorio y móvil. Usa **Imagen completa** para
    conservar todo un afiche o **Rellenar** para recortar y ajustar el
    encuadre horizontal y vertical. El texto puede ir debajo o encima.
    Las promociones existentes se muestran completas, con el texto debajo,
    hasta que guardes otra presentación. El carrusel admite miniaturas,
    flechas, teclado y deslizamiento; se pausa al interactuar o salir de la pestaña.
  - **Fotos de categoría**: abre **Agregar imagen** o **Editar imagen**.
    La foto se muestra como fondo de toda la categoría, detrás del título
    y los platos. Ajusta el encuadre horizontal y vertical, y el sombreado
    para mantener legibles los nombres y precios. La vista previa permite
    revisar el resultado en móvil y escritorio con los platos visibles.
    Las imágenes guardadas con diseños anteriores también se muestran
    como fondo. **Guardar imagen** publica los cambios;
    **Deshacer** recupera lo guardado. Quitar una imagen también requiere guardar.
    Se conservan los documentos y opciones de categorías anteriores.
    Para subir archivos, configura `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` y
    `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (unsigned) en `.env.local` y en
    el entorno publicado. Se admiten JPG, PNG, WebP, AVIF y GIF hasta 10 MB.
    La selección local y el ajuste de la vista previa no suben archivos.
  - **Apariencia**: elige entre Cobre & carbón, Olivo, Reserva, Halloween,
    Navidad y Fiestas Patrias. Cada paleta combina fondo, texto, bordes y
    acentos. La vista previa permite elegir una categoría de platos visibles
    (o muestra ejemplos identificados si la carta está vacía). Puedes ajustar el
    espacio entre platos, activar las decoraciones de temporada y reducir
    el movimiento. Pulsa **Guardar apariencia** para publicar o **Deshacer**
    para volver a la configuración guardada. Elegir una muestra no publica
    cambios. Las preferencias se guardan en `settings/general`, conservando
    el campo `theme` de las versiones anteriores y agregando `appearance`.
    Las preferencias de movimiento reducido del dispositivo se respetan
    incluso cuando el movimiento está activado en el panel.
- Para agregar más administradores, créales un usuario en
  **Authentication → Users** dentro de Firebase.
- **Buscador** en la carta pública (ícono de lupa junto al nombre):
  filtra los platos por nombre o descripción, sin distinguir
  mayúsculas ni tildes.
- **Navegación**: índice lateral en escritorio y categorías desplazables
  en móvil. El acceso «Explorar la carta» lleva directamente a los platos.
- **Fotografías**: toca la foto de un plato para ampliarla y ver su precio
  y descripción. Se cierra con el botón, tocando fuera o presionando Escape.
  La portada usa la primera foto disponible de un plato visible o de sus
  categorías; cuando no hay fotos, muestra un sello decorativo.
- Al compartir el link de la carta (WhatsApp, Instagram, etc.) se
  muestra tu logo y nombre — para que funcione bien, define
  `NEXT_PUBLIC_SITE_URL` en Vercel con la URL real ya publicada.
- Redes sociales en el pie de página: define
  `NEXT_PUBLIC_INSTAGRAM_URL` y/o `NEXT_PUBLIC_FACEBOOK_URL` en Vercel
  para que aparezcan los íconos (si los dejas vacíos, no se muestran).
- El panel de administración ahora muestra un aviso breve
  ("✓ Guardado") cada vez que agregas, editas, ocultas o eliminas
  algo, para confirmar que el cambio se guardó.

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
  PromoSlide.js             → imagen y texto compartidos con el editor de promociones
  AdminCategoryImages.js    → editor de fondos, formas y vista previa de categorías
  CategoryImageBlock.js     → fondo de categoría con encuadre y sombreado
  MenuIntro.js              → portada compartida con la vista previa
  MenuSection.js            → categorías y platos de la carta
  MenuPhoto.js              → fotografías ampliables con diálogo accesible
  FlameIcon.js              → ícono de marca reutilizado en toda la app
lib/
  firebase.js           → conexión a Firestore y Authentication
  cloudinary.js           → subida de imágenes a Cloudinary
  format.js                → formato de precios (CLP) y orden de categorías
```
