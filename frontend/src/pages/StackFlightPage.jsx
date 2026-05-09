import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import SectionLabel from '../components/SectionLabel';
import usePageView from '../hooks/usePageView';

export default function StackFlightPage() {
  usePageView();
  const [scores, setScores] = useState(() => loadScores());
  const [pendingScore, setPendingScore] = useState(null);
  const [scoreName, setScoreName] = useState('Player');
  const [scoreSource, setScoreSource] = useState(null);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'stack-flight-score') return;
      setPendingScore({
        score: Number(event.data.score) || 0,
        lines: Number(event.data.lines) || 0,
      });
      setScoreName('Player');
      setScoreSource(event.source);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-[1120px] mx-auto px-6 md:px-10 pt-8 pb-16">
        <div className="max-w-[720px] mb-5">
          <SectionLabel>Interactive Experiment</SectionLabel>
          <h1 className="text-[28px] md:text-[36px] font-semibold leading-tight m-0" style={{ color: 'var(--text-primary)' }}>
            Stack Flight
          </h1>
          <p className="text-[14px] mt-3 mb-0" style={{ color: 'var(--text-secondary)' }}>
            A browser-based real-time interaction prototype exploring multitasking, input design, and lightweight multiplayer systems.
          </p>
          <div className="flex gap-3 mt-5">
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
          className="relative overflow-hidden rounded-xl"
          style={{ border: '0.5px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <iframe
            src="/games/stack-flight/index.html?embed=1"
            title="Stack Flight"
            className="block w-full"
            style={{ aspectRatio: '7 / 4', border: 0, minHeight: '420px' }}
            allow="autoplay"
            scrolling="no"
          />
          {pendingScore && (
            <div
              className="absolute inset-0 flex items-center justify-center px-6"
              style={{ background: 'rgba(0,0,0,0.72)' }}
            >
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const next = [...loadScores(), {
                    name: scoreName.trim().slice(0, 18) || 'Player',
                    score: pendingScore.score,
                    lines: pendingScore.lines,
                    date: new Date().toISOString(),
                  }]
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 100);
                  localStorage.setItem('stack-flight-rankings', JSON.stringify(next));
                  setScores(next);
                  scoreSource?.postMessage({ type: 'stack-flight-score-saved' }, window.location.origin);
                  setPendingScore(null);
                  setScoreSource(null);
                }}
                className="w-full max-w-[360px] rounded-xl p-5"
                style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)' }}
              >
                <div className="text-[13px] font-mono mb-2" style={{ color: 'var(--text-tertiary)' }}>Save Score</div>
                <div className="text-[24px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{pendingScore.score}</div>
                <div className="text-[13px] mb-4" style={{ color: 'var(--text-secondary)' }}>{pendingScore.lines} lines cleared</div>
                <input
                  autoFocus
                  value={scoreName}
                  onChange={(event) => setScoreName(event.target.value)}
                  maxLength={18}
                  className="w-full text-[14px] px-3 py-2 rounded-md outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingScore(null);
                      setScoreSource(null);
                    }}
                    className="text-[13px] px-3 py-1.5 rounded-md cursor-pointer"
                    style={{ background: 'transparent', border: '0.5px solid var(--border)', color: 'var(--text-tertiary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-[13px] px-3 py-1.5 rounded-md cursor-pointer"
                    style={{ background: 'var(--accent-bg)', border: '0.5px solid var(--accent)', color: 'var(--accent)' }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <section className="mt-8">
          <SectionLabel>Single Mode Ranking</SectionLabel>
          <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
            {scores.length === 0 ? (
              <p className="text-[13px] px-5 py-4 m-0" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-card)' }}>
                No saved scores yet. Finish a Single run to register a score.
              </p>
            ) : scores.slice(0, 100).map((entry, index) => (
              <div
                key={`${entry.name}-${entry.score}-${entry.date}`}
                className="grid grid-cols-[48px_1fr_90px_70px] gap-3 px-5 py-3 text-[13px]"
                style={{ borderTop: index > 0 ? '1px solid var(--border)' : 'none', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
              >
                <span className="font-mono" style={{ color: 'var(--text-tertiary)' }}>{index + 1}</span>
                <span style={{ color: 'var(--text-primary)' }}>{entry.name}</span>
                <span className="font-mono">{entry.score}</span>
                <span className="font-mono" style={{ color: 'var(--text-tertiary)' }}>{entry.lines} lines</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function loadScores() {
  try {
    const parsed = JSON.parse(localStorage.getItem('stack-flight-rankings') || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 100) : [];
  } catch {
    return [];
  }
}
