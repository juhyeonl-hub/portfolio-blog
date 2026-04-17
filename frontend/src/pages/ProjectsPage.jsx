import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import SectionLabel from '../components/SectionLabel';
import usePageView from '../hooks/usePageView';
import { api } from '../services/api';

export default function ProjectsPage() {
  usePageView();
  const [projects, setProjects] = useState([]);

  useEffect(() => { api.get('/public/projects').then(setProjects).catch(() => {}); }, []);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-[720px] mx-auto px-10 pt-12 pb-20">
        <SectionLabel>Projects</SectionLabel>
        <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
          {projects.map((p, i) => (
            <Link key={p.id} to={`/projects/${p.slug}`}
              className="flex items-center justify-between px-5 py-4 no-underline transition-colors"
              style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: 'var(--bg-card)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}>
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-medium block" style={{ color: 'var(--text-primary)' }}>{p.title}</span>
                <span className="text-[13px] block mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{p.shortDescription}</span>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {p.techStack && p.techStack.split(',').slice(0, 3).map(t => (
                  <span key={t.trim()} className="font-mono text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {t.trim()}
                  </span>
                ))}
                <span className="text-[14px] ml-1" style={{ color: 'var(--text-tertiary)' }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
