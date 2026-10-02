import { useApp } from '../AppContext.jsx';

export default function Avatar({ large = false, onClick }) {
  const { photo, initials } = useApp();
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag className={`avatar${large ? ' avatar--lg' : ''}`} onClick={onClick} aria-label={onClick ? 'Profile' : undefined}>
      {photo ? <img src={photo} alt="" /> : initials}
    </Tag>
  );
}
