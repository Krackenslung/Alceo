export default function Chip({ active, children, onClick, className = '' }) {
  return (
    <button
      type="button"
      className={`fchip${active ? ' fchip--on' : ''} ${className}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {active && <span className="fchip__check">✓</span>}
      {children}
    </button>
  );
}
