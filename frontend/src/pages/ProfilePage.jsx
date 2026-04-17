import { useState, useEffect } from 'react';
import { api } from '../services/api';
import characterImg from '../assets/my.png';

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
        <img src={characterImg} alt="JuHyeon" className="w-24 h-auto shrink-0" />
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
      {grouped['summary'] && (
        <div className="bg-gray-800 border-2 border-gray-600 rounded p-5">
          <p className="text-gray-300 text-sm leading-relaxed">
            {grouped['summary'][0].content}
          </p>
        </div>
      )}

      {/* Experience */}
      {grouped['experience'] && (
        <div className="bg-gray-800 border-2 border-gray-600 rounded p-5">
          <h3 className="text-lg font-bold text-white mb-4">Experience</h3>
          <div className="space-y-4">
            {grouped['experience'].map(item => {
              const lines = item.content.split('\n');
              const role = lines[0];
              const bullets = lines.filter(l => l.trim().startsWith('-'));
              return (
                <div key={item.id} className="border-l-2 border-gray-600 pl-4">
                  <h4 className="text-white font-semibold text-sm">{item.title}</h4>
                  <p className="text-gray-500 text-xs mb-2">{role}</p>
                  {bullets.map((b, i) => (
                    <p key={i} className="text-gray-400 text-xs leading-relaxed pl-2 before:content-['•'] before:mr-2 before:text-gray-600">
                      {b.replace(/^-\s*/, '')}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Education & Skills side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Education */}
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

        {/* Skills */}
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

      {/* PDF */}
      <div className="text-center">
        <button onClick={() => window.print()}
          className="px-6 py-2 bg-gray-800 border-2 border-gray-600 text-white font-bold rounded hover:bg-gray-700 hover:border-gray-400 transition-all print:hidden">
          Print / Download PDF
        </button>
      </div>
    </div>
  );
}
