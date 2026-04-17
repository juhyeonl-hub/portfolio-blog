import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function GuestbookPage() {
  const [entries, setEntries] = useState([]);
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = () => {
    api.get('/public/guestbook')
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/public/guestbook', { nickname, message });
      setNickname('');
      setMessage('');
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Guestbook</h1>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8 space-y-4">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Nickname"
          maxLength={50}
          required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Leave a message..."
          rows={3}
          required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
          Post
        </button>
      </form>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-500">No messages yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
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
