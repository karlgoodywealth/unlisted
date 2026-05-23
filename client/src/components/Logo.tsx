export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="Goody Labs"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="7" className="fill-primary" />
      {/* Geometric "G" monogram — open arc with horizontal bar */}
      <path
        d="M22 11.5 A6.5 6.5 0 1 0 22 20.5 L22 16 L16.5 16"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
