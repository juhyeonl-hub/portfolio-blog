import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', excerpt: '', published: false, tags: '' });

  useEffect(() => { load(); }, []);
  const load = () => api.get('/admin/posts').then(setPosts).catch(console.error);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        await api.put(`/admin/posts/${editing}`, payload);
      } else {
        await api.post('/admin/posts', payload);
      }
      setForm({ title: '', content: '', excerpt: '', published: false, tags: '' });
      setEditing(null);
      load();
    } catch (err) { alert(err.message); }
  };

  const handleEdit = (post) => {
    setEditing(post.id);
    setForm({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      published: post.published,
      tags: post.tags ? post.tags.map(t => t.name).join(', ') : '',
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return;
    await api.delete(`/admin/posts/${id}`);
    load();
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Manage Posts</h1>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Post' : 'New Post'}</h2>
        <input type="text" placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
        <input type="text" placeholder="Excerpt (short preview)" value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
        <textarea placeholder="Content (Markdown)" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={12} required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono text-sm" />
        <input type="text" placeholder="Tags (comma-separated: Dev, TIL, Project)" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-gray-300">
            <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} />
            Published
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">{editing ? 'Update' : 'Create'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ title: '', content: '', excerpt: '', published: false, tags: '' }); }}
            className="px-4 py-2 border border-gray-700 text-gray-300 rounded">Cancel</button>}
        </div>
      </form>

      <div className="space-y-3">
        {posts.map(post => (
          <div key={post.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div>
              <span className="text-white font-medium">{post.title}</span>
              <span className={`ml-3 text-xs px-2 py-0.5 rounded ${post.published ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-500'}`}>
                {post.published ? 'Published' : 'Draft'}
              </span>
              {post.tags && post.tags.map(t => (
                <span key={t.id} className="ml-1 text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">{t.name}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(post)} className="text-sm text-blue-400 hover:text-blue-300">Edit</button>
              <button onClick={() => handleDelete(post.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
