import { useApp } from '../AppContext.jsx';

const ITEMS = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'workout', label: 'Workout', icon: '▤' },
  { id: 'progress', label: 'Progress', icon: '◔' },
  { id: 'filters', label: 'Filters', icon: '⚙' },
  { id: 'profile', label: 'Profile', icon: '○' },
];

export default function Sidebar({ active, onChange }) {
  const { generate, generating } = useApp();
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
            <span className="nav__label">{i.label}</span>
          </button>
        ))}
      </nav>
      <button className="sidebar__promo" onClick={() => generate({ navigate: true })} disabled={generating}>
        <p className="promo__title">{generating ? 'Generating…' : '✦ Generate next workout'}</p>
        <p className="promo__text">AI builds it from your filters, profile and recent sessions.</p>
      </button>
    </aside>
  );
}
