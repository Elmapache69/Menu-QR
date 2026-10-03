import Image from "next/image";
import { categoryImageBox, categoryImageStyle } from "@/lib/format";

export default function CategoryImageBlock({
  imageUrl,
  alt,
  shape,
  height,
  position,
  gap,
  layout,
  children,
}) {
  const box = categoryImageBox(shape, height);
  const visual = categoryImageStyle(shape, box.height, box.width, position, gap);
  const floatClass = position === "left" ? "float-left" : "float-right";

  if (layout === "overlay") {
    const scrimClass =
      position === "left"
        ? "bg-gradient-to-l from-char-950/95 via-char-950/75 to-transparent"
        : "bg-gradient-to-r from-char-950/95 via-char-950/75 to-transparent";

    return (
      <div className="relative overflow-hidden rounded-xl ring-1 ring-char-700">
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, 576px"
          className="absolute inset-0 -z-20 object-cover"
        />
        <div className={`absolute inset-0 -z-10 ${scrimClass}`} />
        {/* Espaciador invisible: solo existe para que el texto de más
            abajo se doble alrededor de su forma (shape-outside),
            dejando ver la foto de fondo en esa zona sin estorbo. */}
        <div
          aria-hidden="true"
          style={visual.style}
          className={floatClass}
        />
        <div className="relative p-4 sm:p-5">{children}</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <Image
        src={imageUrl}
        alt={alt}
        width={box.width}
        height={box.height}
        style={visual.style}
        className={`object-cover shadow-lg shadow-black/40 ring-1 ring-char-700 ${visual.className} ${floatClass}`}
      />
      {children}
    </div>
  );
}
