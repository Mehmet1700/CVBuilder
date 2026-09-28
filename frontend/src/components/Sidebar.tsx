export type View = 'cv' | 'cover-letter' | 'applications';

interface SidebarProps {
  active: View;
  onNavigate: (view: View) => void;
}

const NAV_ITEMS: { key: View; label: string; icon: string }[] = [
  { key: 'cv', label: 'CV Editor', icon: '\u{1F4C4}' },
  { key: 'cover-letter', label: 'Cover Letter Editor', icon: '✉️' },
  { key: 'applications', label: 'Applications', icon: '\u{1F4CB}' },
];

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <nav className="sidebar-nav">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">CV</span>
        <span>Builder</span>
      </div>
      <ul>
        {NAV_ITEMS.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              className={item.key === active ? 'nav-item active' : 'nav-item'}
              onClick={() => onNavigate(item.key)}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
