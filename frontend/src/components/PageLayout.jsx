import { Link } from 'react-router-dom';
import SocialIcons from './SocialIcons';
import LangSwitcher from './LangSwitcher';
import usePageView from '../hooks/usePageView';
import { useLang } from '../context/LangContext';

export default function PageLayout({ title, children }) {
  usePageView();
  const { t } = useLang();

  const displayTitle = title ? t(title.toLowerCase() + 'Title') || title : null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            {t('backToMenu')}
          </Link>
          <div className="flex items-center gap-4">
            <LangSwitcher />
            <SocialIcons />
          </div>
        </div>
      </header>

      {displayTitle && (
        <div className="text-center py-8">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
            {displayTitle}
          </h1>
        </div>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pb-12">
        {children}
      </main>
    </div>
  );
}
