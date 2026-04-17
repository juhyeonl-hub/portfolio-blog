import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';

export default function GuestbookPage() {
  const [entries, setEntries] = useState([]);
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useEffect(() => { load(); }, []);

  const load = () => {
    api.get('/public/guestbook').then(setEntries).catch(console.error).finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/public/guestbook', { nickname, message });
      setNickname('');
      setMessage('');
      load();
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-gray-800 border-2 border-gray-600 rounded p-6 mb-8 space-y-4">
        <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
          placeholder={t('nickname')} maxLength={50} required
          className="w-full px-3 py-2 bg-gray-900 border-2 border-gray-700 rounded text-white focus:outline-none focus:border-gray-500" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder={t('leaveMessage')} rows={3} required
          className="w-full px-3 py-2 bg-gray-900 border-2 border-gray-700 rounded text-white focus:outline-none focus:border-gray-500" />
        <button type="submit" className="px-4 py-2 bg-gray-700 border-2 border-gray-500 hover:bg-gray-600 hover:border-gray-400 text-white rounded font-bold transition-all">
          {t('post')}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-400 text-center">{t('loading')}</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-500 text-center">{t('noMessages')}</p>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="bg-gray-800 border-2 border-gray-600 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">{entry.nickname}</span>
                <span className="text-xs text-gray-500">
                  {new Date(entry.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-gray-300 text-sm">{entry.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
