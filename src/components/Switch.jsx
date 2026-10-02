export default function Switch({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`switch${on ? ' switch--on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span className="switch__knob" />
    </button>
  );
}
