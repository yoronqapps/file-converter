import { useState } from 'react';

export default function ConversionPanel({ fileData, onConvert, onReset, isConverting }) {
  const { file, detected, options } = fileData;
  const [selectedTarget, setSelectedTarget] = useState(options[0]);

  return (
    <div
      className="w-full max-w-lg rounded-xl p-7"
      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}
    >
      <div className="flex items-center justify-between pb-5 mb-5 border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="min-w-0">
          <p className="font-medium truncate" style={{ color: 'var(--ink)' }}>{file.name}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="font-mono text-xs px-2 py-0.5 rounded border"
              style={{ borderColor: 'var(--line)', color: 'var(--muted-light)' }}
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
          disabled={isConverting}
          className="text-sm font-mono shrink-0 ml-3 hover:underline disabled:no-underline disabled:opacity-40"
          style={{ color: 'var(--muted-light)', cursor: isConverting ? 'not-allowed' : 'pointer' }}
        >
          CHANGE
        </button>
      </div>

      <p className="text-xs font-mono mb-3" style={{ color: 'var(--muted-light)' }}>
        CONVERT TO
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {options.map((opt) => {
          const active = selectedTarget === opt;
          return (
            <button
              key={opt}
              disabled={isConverting}
              onClick={() => setSelectedTarget(opt)}
              className="font-mono text-sm px-4 py-2 rounded-md border transition-colors disabled:opacity-60"
              style={{
                borderColor: active ? 'var(--pine)' : 'var(--line)',
                backgroundColor: active ? 'var(--pine)' : 'transparent',
                color: active ? 'white' : 'var(--ink)',
                cursor: isConverting ? 'not-allowed' : 'pointer'
              }}
            >
              .{opt.toUpperCase()}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onConvert(selectedTarget)}
        disabled={isConverting || !selectedTarget}
        className="w-full rounded-lg py-3.5 font-display font-medium text-white transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
        style={{ backgroundColor: 'var(--ember)', cursor: isConverting ? 'not-allowed' : 'pointer' }}
      >
        {isConverting ? (
          <>
            <svg className="ui-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5"></circle>
              <path style={{ opacity: 0.85 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Converting format...</span>
          </>
        ) : (
          <span>Convert to .{selectedTarget.toUpperCase()}</span>
        )}
      </button>
    </div>
  );
}