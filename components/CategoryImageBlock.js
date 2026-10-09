import Image from "next/image";
import { clampNumber } from "@/lib/image-settings";

export default function CategoryImageBlock({
  imageUrl, imageFocusX = 50, imageFocusY = 50, overlayShade = 65, children,
}) {
  const objectPosition = clampNumber(imageFocusX, 50) + "% " + clampNumber(imageFocusY, 50) + "%";
  return <div className="category-image-block"
    style={{ "--category-shade": clampNumber(overlayShade, 65, 60, 90) / 100 }}>
    <Image src={imageUrl} alt="" aria-hidden="true" fill sizes="(max-width: 640px) 100vw, 832px"
      className="category-background" style={{ objectPosition }} />
    <div className="category-background-shade" aria-hidden="true" />
    <div className="category-image-content">{children}</div>
  </div>;
}
