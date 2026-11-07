// Original illustrated backdrop for the home hero: Sri Lankan hill country at
// dusk with Sigiriya on the horizon and traffic on the road below.
export function HeroScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 640" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b3527" />
          <stop offset="0.5" stopColor="#1d6648" />
          <stop offset="0.8" stopColor="#d99a52" />
          <stop offset="1" stopColor="#f0bd74" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe2a8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe2a8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14261e" />
          <stop offset="1" stopColor="#0b1511" />
        </linearGradient>
      </defs>
      <rect width="1600" height="640" fill="url(#sky)" />
      <circle cx="1160" cy="430" r="190" fill="url(#glow)" />
      <circle cx="1160" cy="430" r="62" fill="#ffd894" opacity="0.95" />

      {/* Far ranges and Sigiriya */}
      <path d="M0 470 L110 418 L210 448 L340 372 L470 436 L600 392 L720 452 L860 410 L960 466 L1600 452 L1600 640 L0 640 Z" fill="#2a5b46" opacity="0.8" />
      <path d="M930 476 C944 404 962 372 996 364 L1088 360 C1122 366 1140 404 1150 476 Z" fill="#244f3d" />
      <path d="M1150 476 L1270 430 L1380 458 L1500 412 L1600 440 L1600 640 L1150 640 Z" fill="#244f3d" opacity="0.9" />

      {/* Tea-covered hills */}
      <path d="M0 528 C180 474 380 506 600 486 S1010 470 1220 502 S1480 486 1600 504 L1600 640 L0 640 Z" fill="#183f30" />
      <g fill="none" stroke="#235a44" strokeWidth="3" opacity="0.7">
        <path d="M40 548 C220 510 400 530 600 514" />
        <path d="M30 566 C230 532 420 552 640 536" />
        <path d="M980 530 C1150 514 1330 530 1560 520" />
        <path d="M1000 548 C1170 534 1350 548 1590 540" />
      </g>

      {/* Palms */}
      <g fill="#0c2219">
        <path d="M150 600 C148 520 160 450 182 392 L190 394 C170 452 160 520 164 600 Z" />
        <path d="M186 392 C150 370 110 372 76 392 C112 380 150 384 186 400 Z" />
        <path d="M186 392 C206 356 246 340 284 346 C248 352 214 370 190 402 Z" />
        <path d="M186 392 C168 350 132 330 96 332 C130 344 160 364 182 402 Z" />
        <path d="M186 392 C220 384 262 396 290 424 C258 410 222 404 188 404 Z" />
        <path d="M186 392 C192 350 216 322 246 312 C222 332 204 360 192 400 Z" />
        <path d="M1458 604 C1460 532 1450 470 1432 418 L1424 420 C1440 472 1450 534 1446 604 Z" />
        <path d="M1428 418 C1460 394 1500 392 1534 410 C1498 400 1462 406 1430 426 Z" />
        <path d="M1428 418 C1406 386 1368 372 1332 378 C1368 386 1400 400 1426 428 Z" />
        <path d="M1428 418 C1446 378 1480 360 1514 362 C1480 372 1452 392 1432 428 Z" />
        <path d="M1428 418 C1396 412 1356 426 1330 452 C1360 438 1396 430 1428 430 Z" />
      </g>

      {/* Road and traffic */}
      <rect y="586" width="1600" height="54" fill="url(#road)" />
      <g fill="#f3e7c8" opacity="0.35">
        {Array.from({ length: 20 }, (_, i) => (
          <rect key={i} x={i * 84 + 10} y="610" width="44" height="4" rx="2" />
        ))}
      </g>
      <g fill="#07120d">
        {/* car */}
        <path d="M260 600v-8c0-4 2-6 6-7l22-4 15-12c2-2 5-3 8-3h35c3 0 6 1 8 4l11 12 21 3c4 1 7 4 7 8v7c0 2-1 3-3 3H263c-2 0-3-1-3-3Z" />
        <circle cx="288" cy="603" r="9" />
        <circle cx="364" cy="603" r="9" />
        {/* tuk-tuk */}
        <path d="M640 604v-30c0-9 7-16 16-16h58c13 0 24 9 27 21l6 21c1 3-1 5-4 5h-99c-2 0-4-1-4-1Z" />
        <circle cx="666" cy="606" r="8" />
        <circle cx="738" cy="607" r="7" />
        {/* bus */}
        <path d="M1010 602v-44c0-5 4-9 9-9h136c6 0 10 4 11 10l2 43c0 2-1 3-3 3h-152c-2 0-3-1-3-3Z" />
        <circle cx="1046" cy="605" r="10" />
        <circle cx="1136" cy="605" r="10" />
      </g>
      <g fill="#ffd894" opacity="0.85">
        <circle cx="406" cy="592" r="2.5" />
        <circle cx="746" cy="588" r="2.5" />
        <circle cx="1166" cy="590" r="3" />
      </g>
    </svg>
  );
}
