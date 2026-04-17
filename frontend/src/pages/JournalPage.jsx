import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export default function JournalPage() {
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '0');
  const tag = searchParams.get('tag') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    setLoading(true);
    let url = `/public/posts?page=${page}&size=6`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    api.get(url)
      .then(data => {
        setPosts(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, tag, search]);

  const [searchInput, setSearchInput] = useState(search);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(searchInput ? { search: searchInput } : {});
  };

  if (loading) return <div className="text-center text-gray-400 py-12">Loading...</div>;

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search posts..."
          className="flex-1 px-3 py-2 bg-gray-800 border-2 border-gray-600 rounded text-white focus:outline-none focus:border-gray-400" />
        <button type="submit" className="px-4 py-2 bg-gray-800 border-2 border-gray-600 hover:bg-gray-700 hover:border-gray-400 text-gray-300 rounded font-bold transition-all">
          Search
        </button>
      </form>

      {tag && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-gray-400 text-sm">Tag:</span>
          <span className="px-2 py-0.5 text-xs bg-gray-800 border border-gray-600 text-gray-300 rounded">{tag}</span>
          <button onClick={() => setSearchParams({})} className="text-xs text-gray-500 hover:text-white">Clear</button>
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No posts found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map(post => (
            <Link key={post.id} to={`/journal/${post.slug}`}
              className="block bg-gray-800 border-2 border-gray-600 rounded p-5 hover:bg-gray-700 hover:border-gray-400 transition-all active:scale-[0.98]">
              <h3 className="text-lg font-bold text-white mb-1">{post.title}</h3>
              <p className="text-xs text-gray-500 mb-2">
                {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
              {post.excerpt && <p className="text-sm text-gray-400">{post.excerpt}</p>}
              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3">
                  {post.tags.map(t => (
                    <span key={t.id} className="px-2 py-0.5 text-xs bg-gray-900 border border-gray-700 text-gray-400 rounded">{t.name}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 mt-8 justify-center">
          {page > 0 && (
            <button onClick={() => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('page', String(page - 1)); return p; })}
              className="px-4 py-2 bg-gray-800 border-2 border-gray-600 text-gray-300 rounded font-bold hover:bg-gray-700 hover:border-gray-400">Prev</button>
          )}
          <span className="px-4 py-2 text-gray-400">{page + 1} / {totalPages}</span>
          {page < totalPages - 1 && (
            <button onClick={() => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('page', String(page + 1)); return p; })}
              className="px-4 py-2 bg-gray-800 border-2 border-gray-600 text-gray-300 rounded font-bold hover:bg-gray-700 hover:border-gray-400">Next</button>
          )}
        </div>
      )}
    </div>
  );
}
