import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import Nav from '../components/Nav';
import usePageView from '../hooks/usePageView';
import { api } from '../services/api';

export default function BlogPostPage() {
  usePageView();
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/public/posts/${slug}`).then(setPost).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{ background: 'var(--bg)', minHeight: '100vh' }}><Nav /></div>;
  if (!post) return <div style={{ background: 'var(--bg)', minHeight: '100vh' }}><Nav /><div className="max-w-[720px] mx-auto px-10 pt-12" style={{ color: 'var(--text-secondary)' }}>Post not found.</div></div>;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-[720px] mx-auto px-10 pt-12 pb-20">
        <Link to="/blog" className="text-[13px] no-underline mb-8 inline-block" style={{ color: 'var(--text-tertiary)' }}>← Back</Link>

        <h1 className="text-[32px] font-semibold tracking-[-1px] mb-2" style={{ color: 'var(--text-primary)' }}>{post.title}</h1>

        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          {post.tags && post.tags.map(t => (
            <span key={t.id} className="font-mono text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{t.name}</span>
          ))}
        </div>

        <article className="prose prose-invert prose-sm max-w-none
          [&_h2]:text-[18px] [&_h2]:font-medium [&_h2]:mt-8 [&_h2]:mb-3
          [&_h3]:text-[15px] [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2
          [&_p]:text-[14px] [&_p]:leading-[1.7] [&_p]:font-light
          [&_li]:text-[14px] [&_li]:font-light
          [&_strong]:font-medium
          [&_code]:font-mono [&_code]:text-[12px]
          [&_pre]:rounded-lg [&_pre]:text-[13px]"
          style={{ '--tw-prose-body': 'var(--text-secondary)', '--tw-prose-headings': 'var(--text-primary)', '--tw-prose-code': 'var(--text-primary)', '--tw-prose-pre-bg': 'var(--bg-card)' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {post.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
