export const THEMES = [
  { id: "default", name: "Cobre & carbón", description: "Cobre cálido, crema y la esencia de nuestra parrilla.", group: "Clásicos", kicker: "El gusto de compartir", background: "#12100e" },
  { id: "olive", name: "Olivo", description: "Verde profundo y dorado, con un aire natural.", group: "Clásicos", kicker: "Un momento para disfrutar", background: "#101411" },
  { id: "wine", name: "Reserva", description: "Borgoña, tonos rosados y una mesa con carácter.", group: "Clásicos", kicker: "Una mesa, buenos momentos", background: "#170f13" },
  { id: "halloween", name: "Halloween", description: "Ámbar y ciruela para una noche diferente.", group: "Celebraciones", kicker: "Una noche con mucho sabor", background: "#160f1b" },
  { id: "christmas", name: "Navidad", description: "Verde pino, dorado y luces para celebrar.", group: "Celebraciones", kicker: "El sabor de estar juntos", background: "#0e1714" },
  { id: "fiestasPatrias", name: "Fiestas Patrias", description: "Azul noche, rojo y detalles de nuestra tierra.", group: "Celebraciones", kicker: "Celebremos a la chilena", background: "#101521" },
];

export function getTheme(id) {
  return THEMES.find((theme) => theme.id === id) || THEMES[0];
}

// Conserva los documentos anteriores, que solo guardaban el campo theme.
export function resolveAppearance(settings = {}) {
  return {
    theme: getTheme(settings?.theme).id,
    density: settings?.appearance?.density === "compact" ? "compact" : "comfortable",
    decorations: settings?.appearance?.decorations !== false,
    motion: settings?.appearance?.motion !== false,
  };
}

export function sameAppearance(a, b) {
  return a.theme === b.theme && a.density === b.density &&
    a.decorations === b.decorations && a.motion === b.motion;
}
