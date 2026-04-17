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
    let url = `/public/posts?page=${page}&size=10`;
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

  const handleTagClick = (tagName) => {
    setSearchParams({ tag: tagName });
  };

  if (loading) return <div className="px-6 py-20 text-gray-400">Loading...</div>;

  return (
    <div className="px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-6">Journal</h1>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search posts..."
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
        />
        <button type="submit" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded">Search</button>
      </form>

      {tag && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-gray-400">Filtered by tag:</span>
          <span className="px-2 py-0.5 text-xs bg-blue-900 text-blue-300 rounded">{tag}</span>
          <button onClick={() => setSearchParams({})} className="text-xs text-gray-500 hover:text-white">Clear</button>
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-gray-500">No posts found.</p>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <article key={post.id} className="border-b border-gray-800 pb-6">
              <Link to={`/journal/${post.slug}`} className="block group">
                <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {post.excerpt && <p className="text-gray-400 text-sm">{post.excerpt}</p>}
              </Link>
              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {post.tags.map(t => (
                    <button key={t.id} onClick={() => handleTagClick(t.name)}
                      className="px-2 py-0.5 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700">
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 mt-8 justify-center">
          {page > 0 && (
            <button onClick={() => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('page', String(page - 1)); return p; })}
              className="px-3 py-1 text-sm border border-gray-700 text-gray-300 rounded hover:border-gray-500">Prev</button>
          )}
          <span className="px-3 py-1 text-sm text-gray-400">Page {page + 1} of {totalPages}</span>
          {page < totalPages - 1 && (
            <button onClick={() => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('page', String(page + 1)); return p; })}
              className="px-3 py-1 text-sm border border-gray-700 text-gray-300 rounded hover:border-gray-500">Next</button>
          )}
        </div>
      )}
    </div>
  );
}
