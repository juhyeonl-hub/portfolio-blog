import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function ResumePage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/resume')
      .then(setSections)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="px-6 py-20 text-gray-400">Loading...</div>;

  const grouped = {};
  sections.forEach(s => {
    if (!grouped[s.sectionType]) grouped[s.sectionType] = [];
    grouped[s.sectionType].push(s);
  });

  const sectionOrder = ['summary', 'skills', 'experience', 'education', 'languages', 'contact'];

  return (
    <div className="px-6 py-12 max-w-3xl">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-bold text-white">Resume</h1>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-sm border border-gray-700 hover:border-gray-500 text-gray-300 rounded transition-colors print:hidden"
        >
          Print / PDF
        </button>
      </div>

      {sectionOrder.map(type => {
        const items = grouped[type];
        if (!items) return null;

        return (
          <section key={type} className="mb-10">
            {type === 'summary' ? (
              <div className="text-gray-300 leading-relaxed">{items[0].content}</div>
            ) : type === 'skills' ? (
              <>
                <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-800">
                  {items[0].title}
                </h2>
                <div className="space-y-1">
                  {items[0].content.split('\n').map((line, i) => {
                    const [label, value] = line.split(':').map(s => s.trim());
                    if (!value) return null;
                    return (
                      <div key={i} className="flex gap-2">
                        <span className="text-gray-400 font-medium min-w-[120px]">{label}:</span>
                        <span className="text-gray-300">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : type === 'experience' ? (
              <>
                <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-800">
                  Professional Experience
                </h2>
                <div className="space-y-6">
                  {items.map(item => {
                    const lines = item.content.split('\n');
                    const subtitle = lines[0];
                    const bullets = lines.slice(1).filter(l => l.trim().startsWith('-'));
                    return (
                      <div key={item.id}>
                        <h3 className="text-white font-medium">{item.title}</h3>
                        <p className="text-sm text-gray-400 mb-2">{subtitle}</p>
                        <ul className="space-y-1">
                          {bullets.map((b, i) => (
                            <li key={i} className="text-gray-300 text-sm pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gray-500">
                              {b.replace(/^-\s*/, '')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-800">
                  {items[0].title}
                </h2>
                <div className="text-gray-300 whitespace-pre-line">{items[0].content}</div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
