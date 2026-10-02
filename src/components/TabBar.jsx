const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'workout', label: 'Workout' },
];

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tabbar__item${active === t.id ? ' tabbar__item--active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
