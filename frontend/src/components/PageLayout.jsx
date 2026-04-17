import { Link } from 'react-router-dom';
import SocialIcons from './SocialIcons';
import usePageView from '../hooks/usePageView';

export default function PageLayout({ title, children }) {
  usePageView();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            &larr; Back to Menu
          </Link>
          <SocialIcons />
        </div>
      </header>

      {/* Title */}
      {title && (
        <div className="text-center py-8">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
            {title}
          </h1>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pb-12">
        {children}
      </main>
    </div>
  );
}
