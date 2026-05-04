import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Nav from '../components/Nav';
import SectionLabel from '../components/SectionLabel';
import usePageView from '../hooks/usePageView';
import { api } from '../services/api';

const PAGE_SIZE = 12;

export default function BlogPage() {
  usePageView();
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '0');
  const tag = searchParams.get('tag') || '';
  const search = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    let url = `/public/posts?page=${page}&size=${PAGE_SIZE}`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    api.get(url).then(d => { setPosts(d.content); setTotalPages(d.totalPages); }).catch(() => {}).finally(() => setLoading(false));
  }, [page, tag, search]);

  const submitSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    const trimmed = searchInput.trim();
    if (trimmed) next.set('search', trimmed);
    if (tag) next.set('tag', tag);
    setSearchParams(next);
  };

  const clearSearch = () => {
    setSearchInput('');
    const next = new URLSearchParams();
    if (tag) next.set('tag', tag);
    setSearchParams(next);
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-[720px] mx-auto px-10 pt-12 pb-20">
        <SectionLabel>Journal</SectionLabel>

        <form onSubmit={submitSearch} className="mb-6 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: 'var(--text-tertiary)' }} aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search journal..."
            className="w-full text-[14px] py-2.5 pl-10 pr-10 rounded-md outline-none transition-colors focus:border-[color:var(--accent)]"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            aria-label="Search journal"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full cursor-pointer transition-opacity hover:opacity-100"
              style={{
                color: 'var(--text-tertiary)',
                background: 'transparent',
                border: 'none',
                opacity: 0.7,
                fontSize: '16px',
                lineHeight: 1,
              }}
              aria-label="Clear search"
            >×</button>
          )}
        </form>

        {(tag || search) && (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            {tag && (
              <>
                <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>tag:</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{tag}</span>
              </>
            )}
            {search && (
              <>
                <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>search:</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>"{search}"</span>
              </>
            )}
            <button onClick={() => setSearchParams({})} className="text-[11px] cursor-pointer" style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none' }}>clear all</button>
          </div>
        )}

        {loading ? null : posts.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            {search ? `No posts match "${search}".` : 'No posts yet.'}
          </p>
        ) : (
          <div>
            {posts.map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`}
                className="flex items-center justify-between py-3 no-underline transition-opacity hover:opacity-60"
                style={{ borderBottom: '0.5px solid var(--border)' }}>
                <span className="text-[14px]" style={{ color: 'var(--text-primary)' }}>{post.title}</span>
                <span className="font-mono text-[11px] shrink-0 ml-4" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }).replace('/', '.')}
                </span>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex gap-4 mt-8 justify-center">
            {page > 0 && <button onClick={() => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('page', String(page - 1)); return p; })} className="text-[13px] cursor-pointer" style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}>← Prev</button>}
            <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{page + 1} / {totalPages}</span>
            {page < totalPages - 1 && <button onClick={() => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('page', String(page + 1)); return p; })} className="text-[13px] cursor-pointer" style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}>Next →</button>}
          </div>
        )}
      </div>
    </div>
  );
}
