import { Link } from 'react-router-dom';
import SocialIcons from '../components/SocialIcons';
import usePageView from '../hooks/usePageView';

export default function HomePage() {
  usePageView();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        {/* Character placeholder */}
        <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gray-800 border-4 border-gray-600 flex items-center justify-center">
          <span className="text-4xl">🧑‍💻</span>
        </div>

        {/* Title - Minecraft style */}
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
          JuHyeon's
        </h1>
        <h2 className="text-3xl md:text-4xl font-black text-gray-300 mb-12 tracking-tight italic">
          Adventure
        </h2>

        {/* Menu buttons - Minecraft style */}
        <div className="flex flex-col gap-3 max-w-xs mx-auto mb-10">
          <MenuButton to="/showcase">SHOWCASE</MenuButton>
          <MenuButton to="/profile">PROFILE</MenuButton>
          <MenuButton to="/journal">JOURNAL</MenuButton>
        </div>

        {/* Social icons */}
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
