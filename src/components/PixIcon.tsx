import { faPix } from "@fortawesome/free-brands-svg-icons/faPix";

export function PixIcon({ className = "h-6 w-6" }: { className?: string }) {
  const [width, height, , , paths] = faPix.icon;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {(Array.isArray(paths) ? paths : [paths]).map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
