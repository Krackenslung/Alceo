import { useApp } from '../AppContext.jsx';
import Avatar from './Avatar.jsx';

export default function TopActions() {
  const { go } = useApp();
  return (
    <div className="topbar__actions">
      <button className="icon-btn" aria-label="Settings" onClick={() => go('profile')}>⚙</button>
      <Avatar onClick={() => go('profile')} />
    </div>
  );
}
