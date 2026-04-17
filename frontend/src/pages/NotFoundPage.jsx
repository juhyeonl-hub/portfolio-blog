import { useState } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import characterImg from '../assets/my.png';

const messages = [
  "You found a secret page! ...Just kidding. It doesn't exist.",
  "Congratulations! You've discovered the void. There's nothing here.",
  "Plot twist: this page was never real.",
  "You're either very curious or very lost. Either way, respect.",
  "If this page existed, it would be amazing. But it doesn't.",
  "Achievement unlocked: 404 Explorer.",
  "This page went out for coffee and never came back.",
  "You've reached the edge of the internet. Turn back.",
];

export default function NotFoundPage() {
  const [msgIndex] = useState(() => Math.floor(Math.random() * messages.length));

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div className="max-w-[720px] mx-auto px-10 pt-20 text-center">
        <img src={characterImg} alt="404" className="w-28 h-auto mx-auto mb-6" style={{ opacity: 0.8 }} />
        <h1 className="text-[80px] font-semibold tracking-[-3px] mb-2" style={{ color: 'var(--text-primary)' }}>
          404
        </h1>
        <p className="text-[16px] font-light mb-3" style={{ color: 'var(--text-secondary)' }}>
          {messages[msgIndex]}
        </p>
        <p className="text-[13px] mb-10 font-mono" style={{ color: 'var(--text-tertiary)' }}>
          But hey, you found me. That counts for something.
        </p>
        <Link to="/" className="text-[13px] no-underline px-4 py-2 rounded-md transition-colors"
          style={{ border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}>
          ← Take me home
        </Link>
      </div>
    </div>
  );
}
