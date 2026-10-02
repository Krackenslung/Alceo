export default function Segmented({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([id, text]) => (
        <button
          key={id}
          type="button"
          className={`seg__item${value === id ? ' seg__item--on' : ''}`}
          aria-pressed={value === id}
          onClick={() => onChange(id)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
