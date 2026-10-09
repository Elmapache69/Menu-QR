import Image from "next/image";
import FlameIcon from "@/components/FlameIcon";
import { getTheme } from "@/lib/appearance";

export default function MenuIntro({ theme, image, preview = false }) {
  return (
    <div className={`menu-intro${image?.imageUrl ? " menu-intro-with-photo" : ""}`}>
      <div className="menu-intro-copy">
        <p className="menu-eyebrow">{getTheme(theme).kicker}</p>
        <h1 className="menu-intro-title">Nuestra <span>carta.</span></h1>
        <p className="menu-intro-description">Buenos momentos,<br />alrededor de la mesa.</p>
        {preview ? <span className="menu-intro-link" aria-hidden="true">Explorar la carta <span>↓</span></span>
          : <a href="#carta" className="menu-intro-link">Explorar la carta <span aria-hidden="true">↓</span></a>}
      </div>
      {image?.imageUrl ? <div className="menu-intro-photo">
        <Image src={image.imageUrl} alt={image.alt || ""} fill priority
          sizes="(min-width: 1000px) 360px, (min-width: 640px) 280px, 140px"
          className="object-cover" style={{ objectPosition: `center ${image.focusY ?? 50}%` }} />
        <span className="menu-photo-corner" aria-hidden="true"><FlameIcon className="h-6 w-6" /></span>
      </div> : <div className="menu-intro-seal" aria-hidden="true">
        <span>Parrilladas</span><FlameIcon className="menu-intro-flame" /><span>A la mesa</span>
      </div>}
    </div>
  );
}
