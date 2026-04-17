import { useLang } from '../context/LangContext';

const flags = { en: 'EN', ko: '한', ja: 'あ' };

export default function LangSwitcher() {
  const { lang, changeLang } = useLang();

  return (
    <div className="flex gap-1">
      {Object.entries(flags).map(([code, label]) => (
        <button
          key={code}
          onClick={() => changeLang(code)}
          className={`w-8 h-8 text-xs font-bold rounded transition-all ${
            lang === code
              ? 'bg-gray-600 border-2 border-gray-400 text-white'
              : 'bg-gray-800 border-2 border-gray-700 text-gray-400 hover:border-gray-500'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
