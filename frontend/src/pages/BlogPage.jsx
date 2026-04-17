import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Nav from '../components/Nav';
import SectionLabel from '../components/SectionLabel';
import usePageView from '../hooks/usePageView';
import { api } from '../services/api';

export default function BlogPage() {
  usePageView();
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '0');
  const tag = searchParams.get('tag') || '';

  useEffect(() => {
    setLoading(true);
    let url = `/public/posts?page=${page}&size=20`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;
    api.get(url).then(d => { setPosts(d.content); setTotalPages(d.totalPages); }).catch(() => {}).finally(() => setLoading(false));
  }, [page, tag]);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-[720px] mx-auto px-10 pt-12 pb-20">
        <SectionLabel>Journal</SectionLabel>

        {tag && (
          <div className="mb-6 flex items-center gap-2">
            <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>tag:</span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{tag}</span>
            <button onClick={() => setSearchParams({})} className="text-[11px] cursor-pointer" style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none' }}>clear</button>
          </div>
        )}

        {loading ? null : posts.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>No posts yet.</p>
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
            {page > 0 && <button onClick={() => setSearchParams({ page: String(page - 1) })} className="text-[13px] cursor-pointer" style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}>← Prev</button>}
            <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{page + 1} / {totalPages}</span>
            {page < totalPages - 1 && <button onClick={() => setSearchParams({ page: String(page + 1) })} className="text-[13px] cursor-pointer" style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}>Next →</button>}
          </div>
        )}
      </div>
    </div>
  );
}
