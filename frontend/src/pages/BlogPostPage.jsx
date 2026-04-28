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

        <article className="prose prose-invert max-w-none
          [&_h2]:text-[22px] [&_h2]:font-medium [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:tracking-[-0.3px]
          [&_h3]:text-[17px] [&_h3]:font-medium [&_h3]:mt-10 [&_h3]:mb-3
          [&_p]:text-[16px] [&_p]:leading-[1.85] [&_p]:font-light [&_p]:my-6
          [&_li]:text-[16px] [&_li]:font-light [&_li]:leading-[1.8] [&_li]:my-2
          [&_ul]:my-6 [&_ul]:pl-6 [&_ol]:my-6 [&_ol]:pl-6
          [&_strong]:font-medium [&_strong]:text-[color:var(--text-primary)]
          [&_em]:text-[color:var(--text-primary)]
          [&_a]:text-[color:var(--accent)] [&_a]:no-underline hover:[&_a]:underline
          [&_img]:my-8 [&_img]:rounded-lg [&_img]:mx-auto
          [&_hr]:my-10 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-[color:var(--border)]
          [&_blockquote]:border-l-2 [&_blockquote]:pl-5 [&_blockquote]:my-6 [&_blockquote]:italic
          [&_code]:font-mono [&_code]:text-[13px]
          [&_pre]:rounded-lg [&_pre]:text-[13px] [&_pre]:my-6"
          style={{ '--tw-prose-body': 'var(--text-secondary)', '--tw-prose-headings': 'var(--text-primary)', '--tw-prose-code': 'var(--text-primary)', '--tw-prose-pre-bg': 'var(--bg-card)' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {post.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
