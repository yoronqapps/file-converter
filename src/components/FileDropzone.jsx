import { useState, useCallback, useRef } from 'react';
import { detectFileType, getAvailableConversions } from '../lib/detectFileType';

export default function FileDropzone({ onFileReady }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    setError(null);
    setIsAnalyzing(true);
    try {
      const detected = await detectFileType(file);
      const options = getAvailableConversions(detected.ext);

      if (options.length === 0) {
        setError(`We can't convert ".${detected.ext}" files yet.`);
        setIsAnalyzing(false);
        return;
      }

      onFileReady({ file, detected, options });
    } catch (err) {
      setError('Could not read that file. Try a different one.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [onFileReady]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full max-w-lg">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="rounded-xl p-14 text-center cursor-pointer transition-all duration-150"
        style={{
          border: `1.5px dashed ${isDragging ? 'var(--pine)' : 'var(--line)'}`,
          backgroundColor: isDragging ? 'rgba(59, 110, 94, 0.05)' : 'white',
        }}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={handleFileInput} />

        {isAnalyzing ? (
          <p className="font-mono text-sm" style={{ color: 'var(--pine)' }}>
            READING FILE…
          </p>
        ) : (
          <>
            {/* Signature element: source -> target badge motif */}
            <div className="flex items-center justify-center gap-3 mb-5">
              <span
                className="font-mono text-xs px-3 py-1.5 rounded-md border"
                style={{ borderColor: 'var(--line)', color: '#8A8678' }}
              >
                .ANY
              </span>
              <span style={{ color: 'var(--ember)' }} className="text-sm">→</span>
              <span
                className="font-mono text-xs px-3 py-1.5 rounded-md border"
                style={{ borderColor: 'var(--pine)', color: 'var(--pine)' }}
              >
                .ANY
              </span>
            </div>

            <p className="font-display font-medium text-lg" style={{ color: 'var(--ink)' }}>
              Drop a file, or click to browse
            </p>
            <p className="text-sm mt-1" style={{ color: '#A6A299' }}>
              Images, PDFs, CSV, JSON, XLSX
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm font-mono text-center" style={{ color: 'var(--ember)' }}>
          {error}
        </p>
      )}
    </div>
  );
}