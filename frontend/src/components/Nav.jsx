import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Nav() {
  const { theme, toggle } = useTheme();
  const location = useLocation();

  const links = [
    { to: '/projects', label: 'Projects' },
    { to: '/blog', label: 'Blog' },
    { to: '/about', label: 'About' },
  ];

  return (
    <nav className="sticky top-0 z-50" style={{ background: 'var(--bg)', borderBottom: '0.5px solid var(--border)', backdropFilter: 'blur(12px)', backgroundColor: theme === 'dark' ? 'rgba(10,10,10,0.85)' : 'rgba(250,250,250,0.85)' }}>
      <div className="max-w-[720px] mx-auto px-10 h-14 flex items-center justify-between" style={{ maxWidth: '720px' }}>
        <Link to="/" className="text-[14px] font-medium no-underline" style={{ color: 'var(--text-primary)' }}>
          juhyeonl<span style={{ color: 'var(--accent)' }}>.dev</span>
        </Link>
        <div className="flex items-center gap-6">
          {links.map(link => (
            <Link key={link.to} to={link.to}
              className="text-[13px] no-underline transition-colors"
              style={{ color: location.pathname.startsWith(link.to) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {link.label}
            </Link>
          ))}
          <button onClick={toggle}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] transition-colors cursor-pointer"
            style={{ border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)' }}>
            {theme === 'dark' ? '☽' : '☀'}
          </button>
        </div>
      </div>
    </nav>
  );
}
