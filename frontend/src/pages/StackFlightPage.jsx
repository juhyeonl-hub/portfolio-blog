import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import SectionLabel from '../components/SectionLabel';
import usePageView from '../hooks/usePageView';

export default function StackFlightPage() {
  usePageView();

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-[1120px] mx-auto px-6 md:px-10 pt-10 pb-16">
        <div className="max-w-[720px] mb-8">
          <SectionLabel>Interactive Experiment</SectionLabel>
          <h1 className="text-[28px] md:text-[36px] font-semibold leading-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Stack Flight
          </h1>
          <p className="text-[14px] mt-3 mb-0" style={{ color: 'var(--text-secondary)' }}>
            A browser-based real-time interaction prototype exploring multitasking, input design, and lightweight multiplayer systems.
          </p>
          <div className="flex gap-3 mt-5">
            <a
              href="/games/stack-flight/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] no-underline px-3 py-1.5 rounded-md transition-colors"
              style={{ border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              Open Standalone
            </a>
            <Link
              to="/experiments"
              className="text-[13px] no-underline px-3 py-1.5 rounded-md transition-colors"
              style={{ border: '0.5px solid var(--border)', color: 'var(--text-tertiary)' }}
            >
              Back to Experiments
            </Link>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-xl"
          style={{ border: '0.5px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <iframe
            src="/games/stack-flight/index.html?embed=1"
            title="Stack Flight"
            className="block w-full"
            style={{ aspectRatio: '7 / 4', border: 0, minHeight: '420px', maxHeight: 'calc(100vh - 220px)' }}
            allow="autoplay"
            scrolling="no"
          />
        </div>
      </div>
    </div>
  );
}
