export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

export function validateImageFile(file) {
  if (!file || !IMAGE_ACCEPT.split(",").includes(file.type)) {
    throw new Error("Elige una imagen JPG, PNG, WebP, AVIF o GIF.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("La imagen supera los 10 MB. Usa una versión más liviana.");
  }
}

export async function uploadToCloudinary(file, folder = "menu-images") {
  validateImageFile(file);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "La subida de imágenes aún no está configurada. Revisa el Cloud Name y el upload preset de Cloudinary."
    );
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);
  body.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body }
  );

  if (!res.ok) {
    throw new Error("No se pudo subir la imagen. Revisa la conexión y la configuración de Cloudinary e inténtalo de nuevo.");
  }

  const data = await res.json();
  if (!data.secure_url) throw new Error("El servicio de imágenes no devolvió una dirección válida. Inténtalo de nuevo.");
  return data.secure_url;
}
