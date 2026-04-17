import { Link } from 'react-router-dom';
import SocialIcons from '../components/SocialIcons';
import LangSwitcher from '../components/LangSwitcher';
import usePageView from '../hooks/usePageView';
import { useLang } from '../context/LangContext';
import characterImg from '../assets/my.png';

export default function HomePage() {
  usePageView();
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6 relative">
      {/* Language switcher - top right */}
      <div className="absolute top-6 right-6">
        <LangSwitcher />
      </div>

      {/* Character - left side */}
      <img src={characterImg} alt="JuHyeon"
        className="hidden md:block absolute left-[10%] bottom-[15%] w-48 h-auto drop-shadow-lg" />

      {/* Center content */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
          {t('title1')}
        </h1>
        <h2 className="text-3xl md:text-4xl font-black text-gray-300 mb-12 tracking-tight italic">
          {t('title2')}
        </h2>

        <div className="flex flex-col gap-3 max-w-xs mx-auto mb-10">
          <MenuButton to="/showcase">{t('showcase')}</MenuButton>
          <MenuButton to="/profile">{t('profile')}</MenuButton>
          <MenuButton to="/journal">{t('journal')}</MenuButton>
        </div>

        <div className="flex justify-center">
          <SocialIcons />
        </div>
      </div>
    </div>
  );
}

function MenuButton({ to, children }) {
  return (
    <Link
      to={to}
      className="block w-full py-3 px-8 bg-gray-800 border-2 border-gray-600 text-white font-bold text-lg tracking-wider text-center rounded hover:bg-gray-700 hover:border-gray-400 transition-all active:scale-95"
    >
      {children}
    </Link>
  );
}
