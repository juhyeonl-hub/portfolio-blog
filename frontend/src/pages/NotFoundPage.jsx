import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import characterImg from '../assets/my.png';

export default function NotFoundPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-[720px] mx-auto px-10 pt-20 text-center">
        <img src={characterImg} alt="404" className="w-32 h-auto mx-auto mb-8 opacity-60" />
        <h1 className="text-[64px] font-semibold tracking-[-2px] mb-2" style={{ color: 'var(--text-primary)' }}>404</h1>
        <p className="text-[16px] font-light mb-8" style={{ color: 'var(--text-secondary)' }}>
          This page doesn't exist. Maybe it was moved, or you mistyped the URL.
        </p>
        <Link to="/" className="text-[13px] no-underline px-4 py-2 rounded-md transition-colors"
          style={{ border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
