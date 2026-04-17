import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/public/projects/${slug}`)
      .then(setProject)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="px-6 py-20 text-gray-400">Loading...</div>;
  if (error) return <div className="px-6 py-20 text-red-400">{error}</div>;
  if (!project) return null;

  return (
    <div className="px-6 py-12">
      <Link to="/portfolio" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">&larr; Back to Portfolio</Link>

      <h1 className="text-3xl font-bold text-white mb-4">{project.title}</h1>

      {project.techStack && (
        <div className="flex flex-wrap gap-2 mb-6">
          {project.techStack.split(',').map(tech => (
            <span key={tech.trim()} className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded">{tech.trim()}</span>
          ))}
        </div>
      )}

      <div className="flex gap-4 mb-8">
        {project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
             className="px-4 py-2 text-sm border border-gray-700 hover:border-gray-500 text-gray-300 rounded transition-colors">GitHub</a>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
             className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">Live Demo</a>
        )}
      </div>

      <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
        {project.fullDescription}
      </div>

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
