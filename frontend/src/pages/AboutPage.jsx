import { useState, useEffect } from 'react';
import Nav from '../components/Nav';
import SectionLabel from '../components/SectionLabel';
import usePageView from '../hooks/usePageView';
import { api } from '../services/api';
import resumePic from '../assets/resume_pic.png';

export default function AboutPage() {
  usePageView();
  const [sections, setSections] = useState([]);

  useEffect(() => { api.get('/public/resume').then(setSections).catch(() => {}); }, []);

  const grouped = {};
  sections.forEach(s => {
    if (!grouped[s.sectionType]) grouped[s.sectionType] = [];
    grouped[s.sectionType].push(s);
  });

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-[720px] mx-auto px-10 pt-12 pb-20">

        {/* Profile */}
        <div className="flex items-center gap-5 mb-8">
          <img src={resumePic} alt="JuHyeon Lee" className="w-16 h-16 rounded-full object-cover" style={{ border: '0.5px solid var(--border)' }} />
          <div>
            <h1 className="text-[24px] font-semibold tracking-[-0.5px]" style={{ color: 'var(--text-primary)' }}>JuHyeon Lee</h1>
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Vantaa, Finland</p>
          </div>
        </div>

        {grouped['summary'] && (
          <p className="text-[14px] font-light leading-[1.7] mb-12" style={{ color: 'var(--text-secondary)' }}>
            {grouped['summary'][0].content}
          </p>
        )}

        {/* Experience */}
        <section className="mb-12">
          <SectionLabel>Experience</SectionLabel>
          {grouped['experience'] && grouped['experience'].map(item => {
            const lines = item.content.split('\n');
            const role = lines[0];
            const bullets = lines.filter(l => l.trim().startsWith('-'));
            return (
              <div key={item.id} className="mb-6">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>{item.title}</span>
                </div>
                <p className="font-mono text-[11px] mb-2" style={{ color: 'var(--text-tertiary)' }}>{role}</p>
                {bullets.map((b, i) => (
                  <p key={i} className="text-[13px] font-light leading-[1.6] pl-3 mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {b.replace(/^-\s*/, '· ')}
                  </p>
                ))}
              </div>
            );
          })}
        </section>

        {/* Skills */}
        <section className="mb-12">
          <SectionLabel>Skills</SectionLabel>
          {grouped['skills'] && (
            <div className="space-y-2">
              {grouped['skills'][0].content.split('\n').map((line, i) => {
                const idx = line.indexOf(':');
                if (idx === -1) return null;
                return (
                  <div key={i} className="flex gap-2">
                    <span className="font-mono text-[11px] w-[100px] shrink-0 pt-0.5 uppercase" style={{ color: 'var(--text-tertiary)' }}>
                      {line.substring(0, idx).trim()}
                    </span>
                    <span className="text-[13px] font-light" style={{ color: 'var(--text-secondary)' }}>
                      {line.substring(idx + 1).trim()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Education */}
        <section className="mb-12">
          <SectionLabel>Education</SectionLabel>
          {grouped['education'] && grouped['education'][0].content.split('\n\n').map((block, i) => {
            const lines = block.split('\n');
            return (
              <div key={i} className="mb-3">
                <span className="text-[14px] font-medium block" style={{ color: 'var(--text-primary)' }}>{lines[0]}</span>
                {lines[1] && <span className="text-[13px] font-light" style={{ color: 'var(--text-secondary)' }}>{lines[1]}</span>}
              </div>
            );
          })}
        </section>

        {/* Contact */}
        <section>
          <SectionLabel>Contact</SectionLabel>
          <div className="flex gap-5">
            <a href="mailto:xx.juon@gmail.com" className="text-[13px] no-underline" style={{ color: 'var(--text-secondary)' }}>Email</a>
            <a href="https://github.com/juhyeonl-hub" target="_blank" rel="noopener noreferrer" className="text-[13px] no-underline" style={{ color: 'var(--text-secondary)' }}>GitHub</a>
            <a href="https://linkedin.com/in/juhyeon-lee-54aa1a223" target="_blank" rel="noopener noreferrer" className="text-[13px] no-underline" style={{ color: 'var(--text-secondary)' }}>LinkedIn</a>
          </div>
        </section>

        <div className="mt-10 text-center">
          <button onClick={() => window.print()} className="text-[12px] cursor-pointer print:hidden" style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none' }}>
            Print / Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
