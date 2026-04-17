import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());

  function emptyForm() {
    return { title: '', shortDescription: '', fullDescription: '', thumbnailUrl: '', githubUrl: '', demoUrl: '', techStack: '', displayOrder: 0, published: false };
  }

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = () => {
    api.get('/admin/projects').then(setProjects).catch(console.error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/projects/${editing}`, form);
      } else {
        await api.post('/admin/projects', form);
      }
      setForm(emptyForm());
      setEditing(null);
      loadProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (project) => {
    setEditing(project.id);
    setForm({
      title: project.title,
      shortDescription: project.shortDescription || '',
      fullDescription: project.fullDescription || '',
      thumbnailUrl: project.thumbnailUrl || '',
      githubUrl: project.githubUrl || '',
      demoUrl: project.demoUrl || '',
      techStack: project.techStack || '',
      displayOrder: project.displayOrder,
      published: project.published,
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    await api.delete(`/admin/projects/${id}`);
    loadProjects();
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(emptyForm());
  };

  const updateField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Manage Projects</h1>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Project' : 'New Project'}</h2>
        <input type="text" placeholder="Title" value={form.title} onChange={updateField('title')} required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
        <input type="text" placeholder="Short Description" value={form.shortDescription} onChange={updateField('shortDescription')}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
        <textarea placeholder="Full Description" value={form.fullDescription} onChange={updateField('fullDescription')} rows={5}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
        <input type="text" placeholder="Tech Stack (comma-separated)" value={form.techStack} onChange={updateField('techStack')}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="GitHub URL" value={form.githubUrl} onChange={updateField('githubUrl')}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          <input type="text" placeholder="Demo URL" value={form.demoUrl} onChange={updateField('demoUrl')}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
        </div>
        <input type="text" placeholder="Thumbnail URL" value={form.thumbnailUrl} onChange={updateField('thumbnailUrl')}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
        <div className="flex items-center gap-4">
          <input type="number" placeholder="Order" value={form.displayOrder} onChange={updateField('displayOrder')}
            className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          <label className="flex items-center gap-2 text-gray-300">
            <input type="checkbox" checked={form.published} onChange={updateField('published')} />
            Published
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
            {editing ? 'Update' : 'Create'}
          </button>
          {editing && (
            <button type="button" onClick={handleCancel} className="px-4 py-2 border border-gray-700 text-gray-300 rounded">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {projects.map(project => (
          <div key={project.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div>
              <span className="text-white font-medium">{project.title}</span>
              <span className={`ml-3 text-xs px-2 py-0.5 rounded ${project.published ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-500'}`}>
                {project.published ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(project)} className="text-sm text-blue-400 hover:text-blue-300">Edit</button>
              <button onClick={() => handleDelete(project.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
