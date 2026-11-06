import { cn } from "@/lib/cn";

// Side-view silhouettes for each vehicle type, used when an ad has no photos
// and as category icons. Drawn on a 120x60 grid; wheels sit on y≈44.

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="currentColor" />
      <circle cx={cx} cy={cy} r={r * 0.62} className="fill-[var(--art-bg)]" />
      <circle cx={cx} cy={cy} r={r * 0.3} fill="currentColor" />
    </g>
  );
}

const glass = "fill-[var(--art-bg)] opacity-80";

const shapes: Record<string, React.ReactNode> = {
  car: (
    <>
      <path d="M8 41v-6.5c0-3 1.8-4.6 4.6-5.1L30 26.2 41.6 16.6c1.7-1.4 3.8-2.1 6-2.1h27.2c2.6 0 5 1.1 6.7 3l8.8 9.4 16.6 2.2c3.3.5 5.6 3 5.6 6.4v5.5c0 1.3-1 2.3-2.3 2.3H10.3C9 43.3 8 42.3 8 41Z" fill="currentColor" />
      <path d="M45.5 19.2 38.7 26h20.4v-6.8H45.5Zm17.8 0V26h23.4l-6.2-6.8H63.3Z" className={glass} />
      <Wheel cx={31} cy={43} r={9} />
      <Wheel cx={92} cy={43} r={9} />
    </>
  ),
  suv: (
    <>
      <path d="M7 42V30c0-2.6 1.7-4.3 4.3-4.8l12.4-1.9 7.6-11.7c1-1.6 2.8-2.6 4.7-2.6h56.8c2 0 3.8 1.1 4.8 2.8l6.3 11.6 5.2 1c2.6.5 4.4 2.6 4.4 5.2V42c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2Z" fill="currentColor" />
      <path d="M36.3 13.6 30.6 23h27.2v-9.4H36.3Zm25.5 0V23h22v-9.4h-22Zm26 0V23h12.3l-4.5-9.4h-7.8Z" className={glass} />
      <Wheel cx={30} cy={43} r={10} />
      <Wheel cx={93} cy={43} r={10} />
    </>
  ),
  van: (
    <>
      <path d="M7 42V17c0-4.4 3.6-8 8-8h77.6c2.6 0 5 1.3 6.5 3.4l12.3 15.8c.7 1 1.1 2.1 1.1 3.3V42c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2Z" fill="currentColor" />
      <path d="M15 13.5h19v11H15zM38 13.5h19v11H38zM61 13.5h19v11H61zM84 13.5h9.4l8.6 11H84z" className={glass} />
      <Wheel cx={28} cy={43} r={9} />
      <Wheel cx={94} cy={43} r={9} />
    </>
  ),
  pickup: (
    <>
      <path d="M6 42V28.5c0-.8.7-1.5 1.5-1.5H53l4.3-14.3c.6-1.9 2.4-3.2 4.4-3.2h24.6c2.4 0 4.6 1.3 5.8 3.4l7 12.1 9.6 1.7c2.8.5 4.8 2.9 4.8 5.7V42c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2Z" fill="currentColor" />
      <path d="M61.6 13.6 58.7 25h15.6V13.6H61.6Zm16.6 0V25h18.4l-6.6-11.4H78.2Z" className={glass} />
      <Wheel cx={27} cy={43} r={9.5} />
      <Wheel cx={95} cy={43} r={9.5} />
    </>
  ),
  motorbike: (
    <>
      <circle cx={27} cy={42} r={12} fill="none" stroke="currentColor" strokeWidth={4.5} />
      <circle cx={93} cy={42} r={12} fill="none" stroke="currentColor" strokeWidth={4.5} />
      <circle cx={27} cy={42} r={3.2} fill="currentColor" />
      <circle cx={93} cy={42} r={3.2} fill="currentColor" />
      <path d="M27 42 47 29h24l22 13" fill="none" stroke="currentColor" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      <path d="M45 27.5c2.5-6.5 9-10 17-9.3 4.3.4 7.6 2.5 9.8 6.2l2.4 4.1H45.6Z" fill="currentColor" />
      <path d="M30 23.5h15.8l-1.4 4.6H31.6c-1.6 0-2.7-1.6-2.1-3.1l.5-1.5Z" fill="currentColor" />
      <path d="M93 42 81.5 15.5m-3.2-.8h9" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" />
      <circle cx={87} cy={24} r={3.4} fill="currentColor" />
    </>
  ),
  "three-wheeler": (
    <>
      <path d="M19 43V21.5C19 14.6 24.6 9 31.5 9H80c9.6 0 17.8 6.6 20.1 15.9l3.9 15.7c.5 1.9-1 3.4-2.9 3.4H21c-1.1 0-2-.9-2-2Z" fill="currentColor" />
      <path d="M84 13.5c6.4 1.4 10.6 6.3 11.7 13H84v-13Z" className={glass} />
      <path d="M28 20h41v15H28z" className="fill-[var(--art-bg)] opacity-40" />
      <Wheel cx={36} cy={44} r={8.5} />
      <Wheel cx={98} cy={45} r={7.5} />
    </>
  ),
  lorry: (
    <>
      <path d="M4 37V9.5C4 8.7 4.7 8 5.5 8h67c.8 0 1.5.7 1.5 1.5V37H4Z" fill="currentColor" />
      <path d="M77 40V16.5c0-1.4 1.1-2.5 2.5-2.5h20.6c2.3 0 4.4 1.2 5.5 3.2l7.5 12.6c.6 1 .9 2.1.9 3.2V40H77Z" fill="currentColor" />
      <path d="M83.5 18h14.8l6.2 10.5h-21z" className={glass} />
      <path d="M4 37h110v5H4z" fill="currentColor" />
      <Wheel cx={21} cy={43} r={8} />
      <Wheel cx={40} cy={43} r={8} />
      <Wheel cx={97} cy={43} r={8} />
    </>
  ),
  bus: (
    <>
      <path d="M5 41V12.5C5 9.5 7.5 7 10.5 7H105c3.5 0 6.4 2.7 6.6 6.2l1.4 27.6c.1 1.2-.9 2.2-2.1 2.2H7c-1.1 0-2-.9-2-2Z" fill="currentColor" />
      <path d="M11 12h15v12H11zM29 12h15v12H29zM47 12h15v12H47zM65 12h15v12H65zM83 12h11v22H83zM97 12h9.6l1 12H97z" className={glass} />
      <Wheel cx={27} cy={43} r={8.5} />
      <Wheel cx={93} cy={43} r={8.5} />
    </>
  ),
  "heavy-duty": (
    <>
      <path d="M20 31V10c0-1.1.9-2 2-2h28c1 0 1.8.7 2 1.6L56 30" fill="none" stroke="currentColor" strokeWidth={4} strokeLinejoin="round" />
      <path d="M18 29h88c1.1 0 2 .9 2 2v9H18z" fill="currentColor" />
      <path d="M58 22h34c1.1 0 2 .9 2 2v5H58z" fill="currentColor" />
      <path d="M86 22v-8" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={34} cy={41} r={16} fill="currentColor" />
      <circle cx={34} cy={41} r={9} className="fill-[var(--art-bg)]" />
      <circle cx={34} cy={41} r={4} fill="currentColor" />
      <Wheel cx={97} cy={46} r={9} />
    </>
  ),
};

export function VehicleArt({ type, className }: { type: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} aria-hidden="true">
      {shapes[type] ?? shapes.car}
    </svg>
  );
}

const TINTS = ["#4f7cff", "#1aa39a", "#d69a3a", "#c4577a", "#7a6cf0", "#4b8fc9", "#6d8a52"];

/** Placeholder shown in place of a cover photo. */
export function VehiclePlaceholder({ type, seed = 0, className, label }: { type: string; seed?: number; className?: string; label?: string }) {
  const tint = TINTS[Math.abs(seed) % TINTS.length];
  return (
    <div
      className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", className)}
      style={
        {
          "--art-bg": `color-mix(in oklab, var(--surface-2) 88%, ${tint})`,
          background: `radial-gradient(120% 90% at 30% 20%, color-mix(in oklab, var(--surface) 70%, ${tint} 10%), color-mix(in oklab, var(--surface-2) 86%, ${tint}))`,
          color: `color-mix(in oklab, var(--fg-subtle) 55%, ${tint} 25%)`,
        } as React.CSSProperties
      }
    >
      <VehicleArt type={type} className="w-[58%] max-w-56 opacity-70 drop-shadow-sm" />
      {label && <span className="absolute bottom-2.5 left-0 right-0 text-center text-xs font-medium text-fg-subtle">{label}</span>}
    </div>
  );
}
