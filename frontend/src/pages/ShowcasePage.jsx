import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useLang } from '../context/LangContext';

export default function ShowcasePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useEffect(() => {
    api.get('/public/projects')
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-gray-400 py-12">{t('loading')}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map(project => (
        <Link key={project.id} to={`/showcase/${project.slug}`}
          className="block bg-gray-800 border-2 border-gray-600 rounded p-5 hover:bg-gray-700 hover:border-gray-400 transition-all active:scale-[0.98]">
          <h3 className="text-lg font-bold text-white mb-1">{project.title}</h3>
          <p className="text-sm text-gray-400 mb-3">{project.shortDescription}</p>
          {project.techStack && (
            <div className="flex flex-wrap gap-1.5">
              {project.techStack.split(',').map(tech => (
                <span key={tech.trim()} className="px-2 py-0.5 text-xs bg-gray-900 border border-gray-700 text-gray-300 rounded">{tech.trim()}</span>
              ))}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
