"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatCLP } from "@/lib/format";

export default function MenuPhoto({ item, preview = false }) {
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  const photo = <Image src={item.imageUrl} alt={preview ? item.name : ""} width={192} height={192}
    className="menu-item-image" sizes="(min-width: 640px) 96px, 80px" />;

  if (preview) return photo;

  const showPhoto = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };

  return <>
    <button type="button" onClick={showPhoto} className="menu-photo-button" aria-label={`Ampliar foto de ${item.name}`}>
      {photo}
      <span className="menu-photo-expand" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none"><path d="M12 3h5v5M8 17H3v-5m14-9-5 5M3 17l5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </button>
    <dialog ref={dialogRef} className="menu-photo-dialog" aria-label={item.name}
      onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
      {open && <div className="menu-photo-detail">
        <button type="button" autoFocus className="menu-icon-button menu-photo-close" aria-label="Cerrar foto"
          onClick={() => dialogRef.current?.close()}>
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <div className="menu-photo-large"><Image src={item.imageUrl} alt={item.name} fill sizes="(max-width: 640px) 100vw, 640px" className="object-contain" /></div>
        <div className="menu-photo-caption">
          <p className="menu-eyebrow">{item.category || "Nuestra carta"}</p>
          <div className="menu-item-heading"><h2 className="menu-section-title">{item.name}</h2><span className="menu-item-price">{formatCLP(item.price)}</span></div>
          {item.description && <p className="menu-item-description">{item.description}</p>}
        </div>
      </div>}
    </dialog>
  </>;
}
