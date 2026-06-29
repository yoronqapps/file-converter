import { useState } from 'react';
import FileDropzone from './components/FileDropzone';
import ConversionPanel from './components/ConversionPanel';
import { convertFile } from './lib/converters';
import { useTheme } from './lib/useTheme';

function App() {
  const [fileData, setFileData] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState(null);
  const { theme, toggleTheme } = useTheme();

  const handleConvert = async (targetFormat) => {
    setIsConverting(true);
    setConvertError(null);
    try {
      const blob = await convertFile(fileData.file, fileData.detected.ext, targetFormat);
      downloadBlob(blob, fileData.file.name, targetFormat);
    } catch (err) {
      setConvertError(err.message);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--paper)' }}>
      <header className="border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="font-display font-semibold text-lg tracking-tight" style={{ color: 'var(--ink)' }}>
            Convert<span style={{ color: 'var(--ember)' }}>.</span>
          </span>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs tracking-wide hidden sm:inline" style={{ color: 'var(--pine)' }}>
              {isConverting ? 'PROCESSING FILE...' : 'HYBRID WORKER ACTIVE'}
            </span>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center mb-10 max-w-lg">
          <h1 className="font-display font-semibold text-3xl sm:text-4xl tracking-tight mb-3" style={{ color: 'var(--ink)' }}>
            Drop a file. Get any format back.
          </h1>
          <p className="text-base" style={{ color: 'var(--muted)' }}>
            We read the file bytes to know what it truly is.
            Heavy files are securely processed using ephemeral cloud sandboxes.
          </p>
        </div>

        {!fileData ? (
          <FileDropzone onFileReady={setFileData} />
        ) : (
          <ConversionPanel
            fileData={fileData}
            onConvert={handleConvert}
            onReset={() => { if (!isConverting) { setFileData(null); setConvertError(null); } }}
            isConverting={isConverting}
          />
        )}

        {convertError && (
          <p className="mt-4 text-sm font-mono max-w-md text-center" style={{ color: 'var(--ember)' }}>
            {convertError}
          </p>
        )}
      </main>

      <footer className="text-center pb-8">
        <p className="text-xs font-mono" style={{ color: 'var(--muted-light)' }}>
          IMAGES · PDF · DOCX · TXT · XLSX · PPTX
        </p>
      </footer>
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle dark mode"
      className="rounded-md p-2 transition-colors"
      style={{ border: '1px solid var(--line)', color: 'var(--ink)' }}
    >
      {theme === 'dark' ? (
        // Sun icon (click to go light)
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        // Moon icon (click to go dark)
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}

function downloadBlob(blob, originalName, targetFormat) {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}.${targetFormat}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default App;