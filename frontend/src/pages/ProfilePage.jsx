import { useState, useEffect } from 'react';
import { api } from '../services/api';
import resumePic from '../assets/resume_pic.png';

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
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-gray-800 border-2 border-gray-600 rounded p-6 flex flex-col md:flex-row items-center gap-6">
        <img src={resumePic} alt="JuHyeon Lee" className="w-24 h-24 rounded-full object-cover border-4 border-gray-500 shrink-0" />
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-white">JuHyeon Lee</h2>
          <p className="text-gray-400 text-sm mt-1">Vantaa, Finland</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-400 justify-center md:justify-start">
            <span>xx.juon@gmail.com</span>
            <span>044-248-0624</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-800 border-2 border-gray-600 rounded p-5">
        <p className="text-gray-300 text-sm leading-relaxed">{grouped['summary']?.[0]?.content}</p>
      </div>

      {/* Experience */}
      {grouped['experience'] && (
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Experience</h3>
          <div className="space-y-3">
            {grouped['experience'].map(item => (
              <ExperienceCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Education & Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 border-2 border-gray-600 rounded p-5">
          <h3 className="text-lg font-bold text-white mb-3">Education</h3>
          {grouped['education'] && (
            <div className="space-y-3">
              {grouped['education'][0].content.split('\n\n').map((block, i) => {
                const lines = block.split('\n');
                return (
                  <div key={i}>
                    <p className="text-white text-sm font-medium">{lines[0]}</p>
                    {lines[1] && <p className="text-gray-400 text-xs mt-0.5">{lines[1]}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-gray-800 border-2 border-gray-600 rounded p-5">
          <h3 className="text-lg font-bold text-white mb-3">Skills</h3>
          {grouped['skills'] && (
            <div className="space-y-2">
              {grouped['skills'][0].content.split('\n').map((line, i) => {
                const colonIdx = line.indexOf(':');
                if (colonIdx === -1) return null;
                const label = line.substring(0, colonIdx).trim();
                const value = line.substring(colonIdx + 1).trim();
                return (
                  <div key={i}>
                    <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
                    <p className="text-gray-300 text-sm">{value}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Languages */}
      {grouped['languages'] && (
        <div className="bg-gray-800 border-2 border-gray-600 rounded p-5">
          <h3 className="text-lg font-bold text-white mb-2">Languages</h3>
          <div className="flex gap-6">
            {grouped['languages'][0].content.split('\n').map((line, i) => {
              const [lang, level] = line.split(':').map(s => s.trim());
              if (!level) return null;
              return (
                <div key={i} className="text-sm">
                  <span className="text-white font-medium">{lang}</span>
                  <span className="text-gray-400 ml-2">{level}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-center">
        <button onClick={() => window.print()}
          className="px-6 py-2 bg-gray-800 border-2 border-gray-600 text-white font-bold rounded hover:bg-gray-700 hover:border-gray-400 transition-all print:hidden">
          Print / Download PDF
        </button>
      </div>
    </div>
  );
}

function ExperienceCard({ item }) {
  const [open, setOpen] = useState(false);
  const lines = item.content.split('\n');
  const role = lines[0];
  const bullets = lines.filter(l => l.trim().startsWith('-'));

  return (
    <div className="bg-gray-800 border-2 border-gray-600 rounded overflow-hidden cursor-pointer hover:border-gray-400 transition-all"
      onClick={() => setOpen(!open)}>
      <div className="p-4 flex items-center justify-between">
        <div>
          <h4 className="text-white font-semibold text-sm">{item.title}</h4>
          <p className="text-gray-500 text-xs mt-0.5">{role}</p>
        </div>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </div>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-700 pt-3 space-y-1.5">
          {bullets.map((b, i) => (
            <p key={i} className="text-gray-300 text-sm leading-relaxed">
              <span className="text-gray-500 mr-2">•</span>{b.replace(/^-\s*/, '')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
