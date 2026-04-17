import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function PortfolioPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/projects')
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="px-6 py-20 text-gray-400">Loading...</div>;

  return (
    <div className="px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Portfolio</h1>
      {projects.length === 0 ? (
        <p className="text-gray-500">No projects yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(project => (
            <Link
              key={project.id}
              to={`/portfolio/${project.slug}`}
              className="block bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
            >
              {project.thumbnailUrl && (
                <img src={project.thumbnailUrl} alt={project.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <h2 className="text-lg font-semibold text-white mb-2">{project.title}</h2>
                <p className="text-sm text-gray-400 mb-3">{project.shortDescription}</p>
                {project.techStack && (
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.split(',').map(tech => (
                      <span key={tech.trim()} className="px-2 py-0.5 text-xs bg-gray-800 text-gray-300 rounded">
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
