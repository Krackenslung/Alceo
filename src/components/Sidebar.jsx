const ITEMS = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'workout', label: 'Workout', icon: '▤' },
  { id: 'progress', label: 'Progress', icon: '◔' },
  { id: 'filters', label: 'Filters', icon: '⚙' },
  { id: 'profile', label: 'Profile', icon: '○' },
];

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo__mark">A</span>
        <span className="logo__text">Alceo</span>
      </div>
      <nav className="nav">
        {ITEMS.map((i) => (
          <button
            key={i.id}
            className={`nav__item${active === i.id ? ' nav__item--active' : ''}`}
            onClick={() => onChange(i.id)}
          >
            <span className="nav__icon">{i.icon}</span>
            {i.label}
          </button>
        ))}
      </nav>
      <div className="sidebar__promo">
        <p className="promo__title">✦ Generate next week</p>
        <p className="promo__text">Let AI build your plan from this week’s results.</p>
      </div>
    </aside>
  );
}
