import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function ProfilePage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/resume')
      .then(setSections)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-gray-400 py-12">Loading...</div>;

  const grouped = {};
  sections.forEach(s => {
    if (!grouped[s.sectionType]) grouped[s.sectionType] = [];
    grouped[s.sectionType].push(s);
  });

  return (
    <div>
      {/* Profile header */}
      <div className="bg-gray-800 border-2 border-gray-600 rounded p-6 mb-6 flex flex-col md:flex-row items-center gap-6">
        {/* Photo */}
        <div className="w-28 h-28 rounded-full bg-gray-700 border-4 border-gray-500 flex items-center justify-center shrink-0">
          <span className="text-3xl">🧑‍💻</span>
        </div>
        {/* Info */}
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-white mb-1">JuHyeon Lee</h2>
          <p className="text-gray-400">044-248-0624</p>
          <p className="text-gray-400">xx.juon@gmail.com</p>
          <p className="text-gray-500 text-sm mt-1">Vantaa, Finland</p>
        </div>
      </div>

      {/* Sections grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SectionCard title="Education" items={grouped['education']} />
        <SectionCard title="Experience" items={grouped['experience']} />
        <SectionCard title="Goals" items={grouped['summary']} />
      </div>

      {/* Skills */}
      {grouped['skills'] && (
        <div className="bg-gray-800 border-2 border-gray-600 rounded p-5">
          <h3 className="text-lg font-bold text-white mb-3">Technical Skills</h3>
          <div className="space-y-1">
            {grouped['skills'][0].content.split('\n').map((line, i) => {
              const [label, value] = line.split(':').map(s => s.trim());
              if (!value) return null;
              return (
                <div key={i} className="flex gap-2 text-sm">
                  <span className="text-gray-400 font-medium min-w-[100px]">{label}:</span>
                  <span className="text-gray-300">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PDF button */}
      <div className="mt-6 text-center">
        <button onClick={() => window.print()}
          className="px-6 py-2 bg-gray-800 border-2 border-gray-600 text-white font-bold rounded hover:bg-gray-700 hover:border-gray-400 transition-all print:hidden">
          Print / Download PDF
        </button>
      </div>
    </div>
  );
}

function SectionCard({ title, items }) {
  if (!items || items.length === 0) return (
    <div className="bg-gray-800 border-2 border-gray-600 rounded p-5">
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">No content yet.</p>
    </div>
  );

  return (
    <div className="bg-gray-800 border-2 border-gray-600 rounded p-5">
      <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id}>
            {title === 'Experience' && (
              <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
            )}
            <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
              {item.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
