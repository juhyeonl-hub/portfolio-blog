import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import SectionLabel from '../components/SectionLabel';
import usePageView from '../hooks/usePageView';
import { api } from '../services/api';

export default function HomePage() {
  usePageView();
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [sections, setSections] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/public/projects').then(setProjects).catch(() => {});
    api.get('/public/posts?page=0&size=5').then(d => setPosts(d.content || [])).catch(() => {});
    api.get('/public/resume').then(setSections).catch(() => {});
    fetch('/api/public/analytics/stats').then(r => r.ok ? r.json() : null).then(setStats).catch(() => {});
  }, []);

  const grouped = {};
  sections.forEach(s => {
    if (!grouped[s.sectionType]) grouped[s.sectionType] = [];
    grouped[s.sectionType].push(s);
  });

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-[720px] mx-auto px-10">

        {/* Hero */}
        <section className="pt-20 pb-16" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <p className="font-mono text-[12px] uppercase tracking-[1.5px] font-medium mb-4" style={{ color: 'var(--accent)' }}>
            agentic engineering · full-stack
          </p>
          <h1 className="text-[42px] font-semibold leading-[1.1] tracking-[-1.5px] mb-1" style={{ color: 'var(--text-primary)' }}>
            JuHyeon Lee
          </h1>
          <h2 className="text-[42px] font-light leading-[1.1] tracking-[-1.5px] mb-6" style={{ color: 'var(--text-secondary)' }}>
            Building systems that think.
          </h2>
          <p className="text-[16px] font-light leading-[1.7] max-w-[520px] mb-8" style={{ color: 'var(--text-secondary)' }}>
            Backend engineer with experience in enterprise systems, currently exploring agentic AI and systems programming at Hive Helsinki.
          </p>
          <div className="flex gap-5">
            <SocialLink href="https://github.com/juhyeonl-hub" label="GitHub" />
            <SocialLink href="https://linkedin.com/in/juhyeon-lee-54aa1a223" label="LinkedIn" />
            <SocialLink href="https://mail.google.com/mail/?view=cm&fs=1&to=xx.juon@gmail.com" label="Email" />
          </div>
        </section>

        {/* Projects */}
        <section className="py-12" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <SectionLabel right={<Link to="/projects" className="text-[12px] no-underline" style={{ color: 'var(--text-tertiary)' }}>View all →</Link>}>
            Projects
          </SectionLabel>
          <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
            {projects.slice(0, 4).map((p, i) => (
              <Link key={p.id} to={`/projects/${p.slug}`}
                className="flex items-center justify-between px-5 py-4 no-underline transition-colors group"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: 'var(--bg-card)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}>
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-medium block" style={{ color: 'var(--text-primary)' }}>{p.title}</span>
                  <span className="text-[13px] block mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{p.shortDescription}</span>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  {p.techStack && p.techStack.split(',').slice(0, 2).map(t => (
                    <span key={t.trim()} className="font-mono text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                      {t.trim()}
                    </span>
                  ))}
                  <span className="text-[14px] ml-1" style={{ color: 'var(--text-tertiary)' }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Journal */}
        <section className="py-12" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <SectionLabel right={<Link to="/blog" className="text-[12px] no-underline" style={{ color: 'var(--text-tertiary)' }}>All posts →</Link>}>
            Journal
          </SectionLabel>
          {posts.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>No posts yet.</p>
          ) : (
            <div>
              {posts.map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`}
                  className="flex items-center justify-between py-3 no-underline transition-opacity hover:opacity-60"
                  style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <span className="text-[14px]" style={{ color: 'var(--text-primary)' }}>{post.title}</span>
                  <span className="font-mono text-[11px] shrink-0 ml-4" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }).replace('/', '.')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Education */}
        <section className="py-12" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <SectionLabel>Education</SectionLabel>
          <div className="space-y-2">
            <AccordionCard
              title="Hive Helsinki (42 Network)"
              subtitle="Nov 2024 — Present"
              details="Intensive program in low-level systems programming, algorithms, data structures, and software engineering principles. Expected graduation: July 2026."
            />
            <AccordionCard
              title="Gangdong University"
              subtitle="Mar 2015 — Feb 2017"
              details="Associate Degree in Leisure Sports."
            />
          </div>
        </section>

        {/* Experience */}
        <section className="py-12" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <SectionLabel>Experience</SectionLabel>
          <div className="space-y-2">
            {grouped['experience'] && grouped['experience'].map(item => {
              const lines = item.content.split('\n');
              const role = lines[0];
              const bullets = lines.filter(l => l.trim().startsWith('-')).map(b => b.replace(/^-\s*/, ''));
              return (
                <AccordionCard
                  key={item.id}
                  title={item.title}
                  subtitle={role}
                  details={bullets}
                />
              );
            })}
          </div>
        </section>

        {/* Stack */}
        <section className="py-12" style={{ borderBottom: '0.5px solid var(--border)' }}>
          <SectionLabel>Stack</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {['Java', 'Spring Boot', 'C', 'C++', 'Python', 'PostgreSQL', 'Docker', 'REST API', 'Microservices', 'Git', 'POSIX', 'Concurrency'].map(s => (
              <span key={s}
                className="font-mono text-[11px] px-3 py-1.5 rounded-md transition-colors cursor-default"
                style={{ border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          <p>© 2026 JuHyeon Lee · Vantaa, Finland</p>
          {stats && (
            <p className="font-mono mt-2" style={{ color: 'var(--text-tertiary)', opacity: 0.6 }}>
              {stats.total.toLocaleString()} views · {stats.today} today
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}

function SocialLink({ href, label }) {
  return (
    <a href={href} target={href.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer"
      className="text-[13px] no-underline transition-colors hover:opacity-70"
      style={{ color: 'var(--text-secondary)' }}>
      {label}
    </a>
  );
}

function AccordionCard({ title, subtitle, details }) {
  const [open, setOpen] = useState(false);
  const bullets = Array.isArray(details) ? details : null;
  const text = typeof details === 'string' ? details : null;

  return (
    <div
      className="rounded-lg overflow-hidden cursor-pointer transition-colors"
      style={{ border: '0.5px solid var(--border)', background: 'var(--bg-card)' }}
      onClick={() => setOpen(!open)}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}>
      <div className="px-5 py-3.5 flex items-center justify-between">
        <div>
          <span className="text-[14px] font-medium block" style={{ color: 'var(--text-primary)' }}>{title}</span>
          <span className="font-mono text-[11px] mt-0.5 block" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</span>
        </div>
        <span className="text-[12px] transition-transform" style={{ color: 'var(--text-tertiary)', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </div>
      {open && (
        <div className="px-5 pb-4 pt-1" style={{ borderTop: '0.5px solid var(--border)' }}>
          {text && <p className="text-[13px] font-light leading-[1.6]" style={{ color: 'var(--text-secondary)' }}>{text}</p>}
          {bullets && bullets.map((b, i) => (
            <p key={i} className="text-[13px] font-light leading-[1.6] mb-1" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>·</span> {b}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
