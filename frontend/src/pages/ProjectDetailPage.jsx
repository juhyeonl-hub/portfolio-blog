import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import Nav from '../components/Nav';
import usePageView from '../hooks/usePageView';
import { api } from '../services/api';

export default function ProjectDetailPage() {
  usePageView();
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cloneCopied, setCloneCopied] = useState(false);

  useEffect(() => {
    api.get(`/public/projects/${slug}`).then(setProject).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const handleCopy = () => {
    const url = project.githubUrl.replace('https://github.com/', 'git@github.com:') + '.git';
    navigator.clipboard.writeText(`git clone ${url}`);
    setCloneCopied(true);
    setTimeout(() => setCloneCopied(false), 2000);
  };

  if (loading) return <div style={{ background: 'var(--bg)', minHeight: '100vh' }}><Nav /></div>;
  if (!project) return <div style={{ background: 'var(--bg)', minHeight: '100vh' }}><Nav /><div className="max-w-[720px] mx-auto px-10 pt-12" style={{ color: 'var(--text-secondary)' }}>Project not found.</div></div>;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-[720px] mx-auto px-10 pt-12 pb-20">
        <Link to="/projects" className="text-[13px] no-underline mb-8 inline-block" style={{ color: 'var(--text-tertiary)' }}>← Back</Link>

        <h1 className="text-[32px] font-semibold tracking-[-1px] mb-3" style={{ color: 'var(--text-primary)' }}>{project.title}</h1>

        {project.techStack && (
          <div className="flex flex-wrap gap-2 mb-5">
            {project.techStack.split(',').map(t => (
              <span key={t.trim()} className="font-mono text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                {t.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-3 mb-6">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
              className="text-[13px] no-underline px-3 py-1.5 rounded-md transition-colors" style={{ border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}>
              GitHub
            </a>
          )}
          {project.githubUrl && (
            <button onClick={handleCopy}
              className="text-[13px] px-3 py-1.5 rounded-md cursor-pointer transition-colors" style={{ border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)' }}>
              {cloneCopied ? 'Copied!' : 'Clone'}
            </button>
          )}
        </div>

        <article className="prose prose-invert prose-sm max-w-none
          [&_h2]:text-[18px] [&_h2]:font-medium [&_h2]:mt-8 [&_h2]:mb-3
          [&_h3]:text-[15px] [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2
          [&_p]:text-[14px] [&_p]:leading-[1.7] [&_p]:font-light
          [&_li]:text-[14px] [&_li]:font-light
          [&_strong]:font-medium
          [&_code]:font-mono [&_code]:text-[12px]
          [&_pre]:rounded-lg [&_pre]:text-[13px]
          [&_table]:text-[13px]
          [&_th]:font-medium [&_td]:font-light"
          style={{ '--tw-prose-body': 'var(--text-secondary)', '--tw-prose-headings': 'var(--text-primary)', '--tw-prose-code': 'var(--text-primary)', '--tw-prose-pre-bg': 'var(--bg-card)', '--tw-prose-pre-code': 'var(--text-secondary)', '--tw-prose-th-borders': 'var(--border)', '--tw-prose-td-borders': 'var(--border)' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {project.fullDescription}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
