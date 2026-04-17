import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function AdminResumePage() {
  const [sections, setSections] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ sectionType: '', title: '', content: '', displayOrder: 0 });

  useEffect(() => { load(); }, []);

  const load = () => api.get('/admin/resume').then(setSections).catch(console.error);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/resume/${editing}`, form);
      } else {
        await api.post('/admin/resume', form);
      }
      setForm({ sectionType: '', title: '', content: '', displayOrder: 0 });
      setEditing(null);
      load();
    } catch (err) { alert(err.message); }
  };

  const handleEdit = (s) => {
    setEditing(s.id);
    setForm({ sectionType: s.sectionType, title: s.title, content: s.content, displayOrder: s.displayOrder });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this section?')) return;
    await api.delete(`/admin/resume/${id}`);
    load();
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Manage Resume</h1>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <input type="text" placeholder="Section Type" value={form.sectionType} onChange={e => setForm(p => ({ ...p, sectionType: e.target.value }))} required
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          <input type="text" placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
          <input type="number" placeholder="Order" value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
        </div>
        <textarea placeholder="Content" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={6} required
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">{editing ? 'Update' : 'Create'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ sectionType: '', title: '', content: '', displayOrder: 0 }); }} className="px-4 py-2 border border-gray-700 text-gray-300 rounded">Cancel</button>}
        </div>
      </form>

      <div className="space-y-3">
        {sections.map(s => (
          <div key={s.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div>
              <span className="text-xs text-gray-500 mr-2">[{s.sectionType}]</span>
              <span className="text-white">{s.title}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(s)} className="text-sm text-blue-400 hover:text-blue-300">Edit</button>
              <button onClick={() => handleDelete(s.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
