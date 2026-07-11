export function MobiliLogo({ className = "h-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 80" className={className} aria-label="Mobili">
      <text
        x="0"
        y="60"
        fontFamily="'Cormorant Garamond', serif"
        fontSize="60"
        fontWeight="700"
        fill="#C5A059"
        stroke="#C5A059"
        strokeWidth="2.5"
        letterSpacing="2"
      >
        MOBILI
        <tspan fill="#F4EFE6" stroke="none">
          .
        </tspan>
      </text>
    </svg>
  );
}
