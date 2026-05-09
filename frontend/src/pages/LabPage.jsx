import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import SectionLabel from '../components/SectionLabel';
import usePageView from '../hooks/usePageView';

const experiments = [
  {
    slug: 'block-x-flight',
    title: 'Block X Flight',
    description: 'Real-time browser interaction prototype for multitasking, input design, and lightweight multiplayer.',
    tags: ['Canvas', 'WebSocket', 'Game Loop'],
    date: '2026.05',
  },
];

export default function LabPage() {
  usePageView();

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-[720px] mx-auto px-10 pt-12 pb-20">
        <SectionLabel>Lab</SectionLabel>
        <p className="text-[14px] mt-0 mb-6" style={{ color: 'var(--text-secondary)' }}>
          Small playable prototypes and interaction studies that sit between engineering, systems design, and interface work.
        </p>

        <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
          {experiments.map((experiment, i) => (
            <Link
              key={experiment.slug}
              to={`/lab/${experiment.slug}`}
              className="flex items-center justify-between px-5 py-4 no-underline transition-colors"
              style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: 'var(--bg-card)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
            >
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-medium block" style={{ color: 'var(--text-primary)' }}>
                  {experiment.title}
                </span>
                <span className="text-[13px] block mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {experiment.description}
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2 ml-4 shrink-0">
                {experiment.tags.map(tag => (
                  <span key={tag} className="font-mono text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {tag}
                  </span>
                ))}
                <span className="font-mono text-[11px] ml-1" style={{ color: 'var(--text-tertiary)' }}>
                  {experiment.date}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
