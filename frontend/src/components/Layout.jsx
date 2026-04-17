import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePageView from '../hooks/usePageView';

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  usePageView();

  const navLinks = [
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/resume', label: 'Resume' },
    { to: '/journal', label: 'Journal' },
    { to: '/guestbook', label: 'Guestbook' },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-white hover:text-gray-300 transition-colors">
            Juhyeon Lee
          </Link>
          <div className="flex gap-6 text-sm items-center">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`transition-colors ${
                  location.pathname === link.to
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/admin"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Admin
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto">
        {children}
      </main>

      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Juhyeon Lee
        </div>
      </footer>
    </div>
  );
}
