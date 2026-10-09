function Cobweb({ className }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      stroke="white"
      strokeWidth="1"
      fill="none"
      opacity="0.38"
    >
      <path d="M100,0 L95,31 L81,59 L59,81 L31,95 L0,100" strokeOpacity="0" />
      {[0, 18, 36, 54, 72, 90].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = 100 * Math.cos(rad);
        const y = 100 * Math.sin(rad);
        return <line key={deg} x1="0" y1="0" x2={x} y2={y} />;
      })}
      {[20, 40, 60, 80, 100].map((r) => (
        <path key={r} d={`M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`} />
      ))}
    </svg>
  );
}

function Spider() {
  return (
    <svg viewBox="0 0 40 70" className="absolute left-[18%] top-0 h-14 w-8 opacity-70">
      <line x1="20" y1="0" x2="20" y2="40" stroke="white" strokeWidth="1" />
      <ellipse cx="20" cy="48" rx="7" ry="9" fill="#1a1a1a" stroke="white" strokeWidth="0.8" />
      <circle cx="20" cy="38" r="4.5" fill="#1a1a1a" stroke="white" strokeWidth="0.8" />
      {[-1, 1].map((side) =>
        [0, 1, 2, 3].map((i) => (
          <line
            key={`${side}-${i}`}
            x1="20"
            y1={44 + i * 2}
            x2={20 + side * (14 - i * 2)}
            y2={38 + i * 6}
            stroke="white"
            strokeWidth="0.8"
          />
        ))
      )}
    </svg>
  );
}

function Snowflake({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} stroke="white" strokeWidth="1.4" opacity="0.5">
      {[0, 60, 120].map((deg) => (
        <line
          key={deg}
          x1="12"
          y1="2"
          x2="12"
          y2="22"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}

function Garland() {
  const dots = Array.from({ length: 14 });
  const colors = ["#cb2230", "#146e3e", "#ffd680"];
  return (
    <svg viewBox="0 0 1000 40" preserveAspectRatio="none" className="h-8 w-full opacity-70">
      <path
        d="M0,4 Q 62.5,34 125,4 T 250,4 T 375,4 T 500,4 T 625,4 T 750,4 T 875,4 T 1000,4"
        fill="none"
        stroke="#2b2521"
        strokeWidth="1.5"
      />
      {dots.map((_, i) => (
        <circle
          key={i}
          cx={(i + 0.5) * (1000 / dots.length)}
          cy={i % 2 === 0 ? 10 : 20}
          r="5"
          fill={colors[i % colors.length]}
        />
      ))}
    </svg>
  );
}

function Bunting() {
  const flags = Array.from({ length: 16 });
  const colors = ["#cb2230", "#f5f5f5", "#15457d"];
  return (
    <svg viewBox="0 0 1000 40" preserveAspectRatio="none" className="h-8 w-full opacity-80">
      <path d="M0,2 Q500,30 1000,2" fill="none" stroke="#2b2521" strokeWidth="1.5" />
      {flags.map((_, i) => {
        const x = (i + 0.5) * (1000 / flags.length);
        const t = i / (flags.length - 1);
        const y = 2 + Math.sin(t * Math.PI) * 18;
        return (
          <polygon
            key={i}
            points={`${x - 14},${y} ${x + 14},${y} ${x},${y + 22}`}
            fill={colors[i % colors.length]}
          />
        );
      })}
    </svg>
  );
}

export default function ThemeDecorations({ theme }) {
  if (theme === "halloween") {
    return (
      <div className="theme-decorations" aria-hidden="true">
        <div className="absolute -top-2 -left-2 h-40 w-40 sm:h-56 sm:w-56">
          <Cobweb className="h-full w-full" />
          <Spider />
        </div>
        <Cobweb className="absolute -top-2 -right-2 h-32 w-32 -scale-x-100 sm:h-48 sm:w-48" />
      </div>
    );
  }

  if (theme === "christmas") {
    return (
      <div className="theme-decorations" aria-hidden="true">
        <Garland />
        <Snowflake className="absolute left-[8%] top-12 h-5 w-5" />
        <Snowflake className="absolute right-[12%] top-24 h-4 w-4" />
        <Snowflake className="absolute left-[30%] top-32 h-3 w-3" />
      </div>
    );
  }

  if (theme === "fiestasPatrias") {
    return (
      <div className="theme-decorations" aria-hidden="true">
        <Bunting />
      </div>
    );
  }

  return null;
}
