import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { api } from '../services/api';

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cloneCopied, setCloneCopied] = useState(false);

  useEffect(() => {
    api.get(`/public/projects/${slug}`)
      .then(setProject)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopyClone = () => {
    const cloneUrl = project.githubUrl.replace('https://github.com/', 'git@github.com:') + '.git';
    navigator.clipboard.writeText(`git clone ${cloneUrl}`);
    setCloneCopied(true);
    setTimeout(() => setCloneCopied(false), 2000);
  };

  if (loading) return <div className="text-center text-gray-400 py-12">Loading...</div>;
  if (error) return <div className="text-center text-red-400 py-12">{error}</div>;
  if (!project) return null;

  return (
    <div>
      <Link to="/showcase" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">&larr; Back to Showcase</Link>

      <h1 className="text-3xl font-bold text-white mb-4">{project.title}</h1>

      {project.techStack && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.techStack.split(',').map(tech => (
            <span key={tech.trim()} className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded">{tech.trim()}</span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        {project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 text-sm bg-gray-800 border-2 border-gray-600 hover:border-gray-400 text-gray-300 rounded font-bold transition-all">
            GitHub
          </a>
        )}
        {project.githubUrl && (
          <button onClick={handleCopyClone}
            className="px-4 py-2 text-sm bg-gray-800 border-2 border-gray-600 hover:border-gray-400 text-gray-300 rounded font-bold transition-all">
            {cloneCopied ? 'Copied!' : 'Clone'}
          </button>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-all">
            Live Demo
          </a>
        )}
      </div>

      {project.githubUrl && (
        <div className="bg-gray-900 border border-gray-700 rounded p-3 mb-8 flex items-center gap-2">
          <code className="text-xs text-gray-400 flex-1 overflow-x-auto">
            git clone {project.githubUrl.replace('https://github.com/', 'git@github.com:')}.git
          </code>
          <button onClick={handleCopyClone} className="text-xs text-gray-500 hover:text-white shrink-0">
            {cloneCopied ? '✓' : 'Copy'}
          </button>
        </div>
      )}

      <article className="prose prose-invert prose-sm max-w-none
        prose-headings:text-white prose-p:text-gray-300 prose-a:text-blue-400
        prose-code:text-gray-200 prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded
        prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800
        prose-strong:text-white prose-li:text-gray-300
        prose-blockquote:border-gray-700 prose-blockquote:text-gray-400
        prose-th:text-white prose-td:text-gray-300 prose-table:border-gray-700">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {project.fullDescription}
        </ReactMarkdown>
      </article>

      {project.screenshots && project.screenshots.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-white mb-4">Screenshots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.screenshots.map(ss => (
              <div key={ss.id}>
                <img src={ss.imageUrl} alt={ss.caption || ''} className="rounded border border-gray-800" />
                {ss.caption && <p className="text-sm text-gray-400 mt-1">{ss.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
