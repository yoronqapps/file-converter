import { useState } from 'react';

export default function ConversionPanel({ fileData, onConvert, onReset, isConverting }) {
  const { file, detected, options } = fileData;
  const [selectedTarget, setSelectedTarget] = useState(options[0]);

  return (
    <div
      className="w-full max-w-lg rounded-xl p-7"
      style={{ backgroundColor: 'white', border: '1px solid var(--line)' }}
    >
      <div className="flex items-center justify-between pb-5 mb-5 border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="min-w-0">
          <p className="font-medium truncate" style={{ color: 'var(--ink)' }}>{file.name}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="font-mono text-xs px-2 py-0.5 rounded border"
              style={{ borderColor: 'var(--line)', color: '#8A8678' }}
            >
              .{detected.ext.toUpperCase()}
            </span>
            {detected.confidence !== 'high' && (
              <span className="text-xs font-mono" style={{ color: 'var(--ember)' }}>
                LOW CONFIDENCE
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-sm font-mono shrink-0 ml-3 hover:underline"
          style={{ color: '#A6A299' }}
        >
          CHANGE
        </button>
      </div>

      <p className="text-xs font-mono mb-3" style={{ color: '#A6A299' }}>
        CONVERT TO
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {options.map((opt) => {
          const active = selectedTarget === opt;
          return (
            <button
              key={opt}
              onClick={() => setSelectedTarget(opt)}
              className="font-mono text-sm px-4 py-2 rounded-md border transition-colors"
              style={{
                borderColor: active ? 'var(--pine)' : 'var(--line)',
                backgroundColor: active ? 'var(--pine)' : 'white',
                color: active ? 'white' : 'var(--ink)',
              }}
            >
              .{opt.toUpperCase()}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onConvert(selectedTarget)}
        disabled={isConverting}
        className="w-full rounded-lg py-3.5 font-display font-medium text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: 'var(--ember)' }}
      >
        {isConverting ? 'Converting…' : `Convert to .${selectedTarget.toUpperCase()}`}
      </button>
    </div>
  );
}