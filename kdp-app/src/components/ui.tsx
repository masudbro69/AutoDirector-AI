import React from 'react';
import { X } from 'lucide-react';
import { pct } from '../utils';

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className={`modal ${wide ? 'modalWide' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <h3>{title}</h3>
          <button className="iconBtn" onClick={onClose} aria-label="বন্ধ করুন">
            <X size={16} />
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="fieldLabel">
        {label}
        {hint && <em>{hint}</em>}
      </span>
      {children}
    </label>
  );
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder,
}: {
  value: number | undefined;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      className="input"
      value={Number.isFinite(value) ? value : ''}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        onChange(Number.isFinite(v) ? v : 0);
      }}
    />
  );
}

export function ProgressBar({ value, max, color, height }: { value: number; max: number; color?: string; height?: number }) {
  return (
    <div className="bar" style={height ? { height } : undefined}>
      <i style={{ width: `${pct(value, max)}%`, background: color || 'var(--accent-grad)' }} />
    </div>
  );
}

export function Ring({ percent, size = 132, stroke = 11, color, children }: { percent: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <div className="ringWrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-strong)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color || 'var(--accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ringInner">{children}</div>
    </div>
  );
}

export function Chip({ tone, children }: { tone: 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'accent'; children: React.ReactNode }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function EmptyState({ icon, title, detail, action }: { icon: React.ReactNode; title: string; detail: string; action?: React.ReactNode }) {
  return (
    <div className="emptyState">
      <div className="emptyIcon">{icon}</div>
      <h4>{title}</h4>
      <p>{detail}</p>
      {action}
    </div>
  );
}

export function SectionHead({ eyebrow, title, sub, action }: { eyebrow?: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="sectionHead">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
