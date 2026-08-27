function Comet({
  top,
  delay,
  durasi,
  scale,
}: {
  top: string;
  delay: string;
  durasi: string;
  scale: number;
}) {
  return (
    <div
      className="comet-wrap"
      style={{
        top,
        animationDelay: delay,
        animationDuration: durasi,
        transform: `scale(${scale})`,
      }}
    >
      <svg width="180" height="60" viewBox="0 0 180 60" fill="none" className="block">
        <defs>
          {/* ekor V: transparan di pangkal (kiri, lebar) → terang di kepala (kanan) */}
          <linearGradient id="cometEkor" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8fdcff" stopOpacity="0" />
            <stop offset="70%" stopColor="#bfeeff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#eaf8ff" stopOpacity="0.75" />
          </linearGradient>
          <radialGradient id="cometHead" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="60%" stopColor="#cdeeff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#8fdcff" stopOpacity="0" />
          </radialGradient>
          <filter id="cometBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>

        {/* Ekor bentuk V — dua garis dari kepala melebar ke belakang */}
        <path
          d="M150 30 L 8 20"
          stroke="url(#cometEkor)"
          strokeWidth="1.5"
          strokeLinecap="round"
          filter="url(#cometBlur)"
        />
        <path
          d="M150 30 L 8 40"
          stroke="url(#cometEkor)"
          strokeWidth="1.5"
          strokeLinecap="round"
          filter="url(#cometBlur)"
        />
        {/* garis tengah tipis biar V-nya keisi dikit */}
        <path
          d="M150 30 L 20 30"
          stroke="url(#cometEkor)"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* partikel di sepanjang ekor */}
        <circle cx="60" cy="27" r="0.8" fill="#eaf8ff" opacity="0.7" />
        <circle cx="85" cy="33" r="0.7" fill="#cdeeff" opacity="0.6" />
        <circle cx="110" cy="29" r="0.9" fill="#ffffff" opacity="0.7" />
        <circle cx="130" cy="31" r="0.6" fill="#cdeeff" opacity="0.5" />

        {/* kepala kecil: glow halus + inti mungil */}
        <circle cx="152" cy="30" r="4" fill="url(#cometHead)" />
        <circle cx="152" cy="30" r="1" fill="#ffffff" filter="url(#cometBlur)" />
      </svg>
    </div>
  );
}

export function Comets() {
  // durasi = total siklus (lintas + jeda). Makin gede makin jarang lewat.
  const list = [
    { top: "8%", delay: "0s", durasi: "22s", scale: 0.8 },
    { top: "20%", delay: "4s", durasi: "26s", scale: 0.55 },
    { top: "34%", delay: "9s", durasi: "24s", scale: 0.7 },
    { top: "50%", delay: "13s", durasi: "28s", scale: 0.6 },
    { top: "64%", delay: "18s", durasi: "23s", scale: 0.75 },
    { top: "78%", delay: "22s", durasi: "27s", scale: 0.5 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {list.map((k, i) => (
        <Comet key={i} {...k} />
      ))}
    </div>
  );
}