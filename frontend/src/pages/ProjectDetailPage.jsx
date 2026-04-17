import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';
import Nav from '../components/Nav';
import usePageView from '../hooks/usePageView';
import { api } from '../services/api';

export default function ProjectDetailPage() {
  usePageView();
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [readme, setReadme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cloneCopied, setCloneCopied] = useState(false);

  useEffect(() => {
    api.get(`/public/projects/${slug}`)
      .then(p => {
        setProject(p);
        if (p.githubUrl) {
          const repoPath = p.githubUrl.replace('https://github.com/', '');
          return fetch(`https://raw.githubusercontent.com/${repoPath}/main/README.md`)
            .then(r => r.ok ? r.text() : null)
            .then(text => setReadme(text))
            .catch(() => setReadme(null));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopy = () => {
    const url = project.githubUrl.replace('https://github.com/', 'git@github.com:') + '.git';
    navigator.clipboard.writeText(`git clone ${url}`);
    setCloneCopied(true);
    setTimeout(() => setCloneCopied(false), 2000);
  };

  if (loading) return <div style={{ background: 'var(--bg)', minHeight: '100vh' }}><Nav /></div>;
  if (!project) return <div style={{ background: 'var(--bg)', minHeight: '100vh' }}><Nav /><div className="max-w-[720px] mx-auto px-10 pt-12" style={{ color: 'var(--text-secondary)' }}>Project not found.</div></div>;

  const content = readme || project.fullDescription;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-[720px] mx-auto px-10 pt-12 pb-20">
        <Link to="/projects" className="text-[13px] no-underline mb-8 inline-block" style={{ color: 'var(--text-tertiary)' }}>← Back</Link>

        <div className="flex gap-3 mb-8 items-center">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
              className="text-[13px] no-underline px-3 py-1.5 rounded-md transition-colors" style={{ border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}>
              GitHub
            </a>
          )}
          {project.githubUrl && (
            <button onClick={handleCopy}
              className="font-mono text-[12px] px-3 py-1.5 rounded-md cursor-pointer transition-colors" style={{ border: '0.5px solid var(--border)', background: 'transparent', color: cloneCopied ? 'var(--accent)' : 'var(--text-tertiary)' }}>
              {cloneCopied ? '✓ Copied!' : `git clone ${project.githubUrl.replace('https://github.com/', 'git@github.com:')}.git`}
            </button>
          )}
        </div>

        {/* README rendered like GitHub */}
        <article className="github-readme">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              img: ({ src, alt, ...props }) => {
                if (src && !src.startsWith('http')) {
                  const repoPath = project.githubUrl.replace('https://github.com/', '');
                  src = `https://raw.githubusercontent.com/${repoPath}/main/${src}`;
                }
                return <img src={src} alt={alt} {...props} style={{ maxWidth: '100%', borderRadius: '8px' }} />;
              },
              a: ({ href, children, ...props }) => {
                if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto')) {
                  const repoPath = project.githubUrl.replace('https://github.com/', '');
                  href = `https://github.com/${repoPath}/blob/main/${href}`;
                }
                return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
