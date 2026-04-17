export default function SectionLabel({ children, right }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <span className="font-mono text-[12px] uppercase tracking-[1.5px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
        {children}
      </span>
      {right}
    </div>
  );
}
