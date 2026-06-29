import { useState } from 'react';
import FileDropzone from './components/FileDropzone';
import ConversionPanel from './components/ConversionPanel';
import { convertFile } from './lib/converters';

function App() {
  const [fileData, setFileData] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState(null);

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
      {/* Top bar */}
      <header className="border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="font-display font-semibold text-lg tracking-tight" style={{ color: 'var(--ink)' }}>
            Convert<span style={{ color: 'var(--ember)' }}>.</span>
          </span>
          <span className="font-mono text-xs tracking-wide" style={{ color: 'var(--pine)' }}>
            {isConverting ? 'PROCESSING FILE...' : 'HYBRID WORKER ACTIVE'}
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center mb-10 max-w-lg">
          <h1 className="font-display font-semibold text-3xl sm:text-4xl tracking-tight mb-3" style={{ color: 'var(--ink)' }}>
            Drop a file. Get any format back.
          </h1>
          <p className="text-base" style={{ color: '#6B6862' }}>
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
        <p className="text-xs font-mono" style={{ color: '#A6A299' }}>
          IMAGES · PDF · DOCX · TXT · XLSX · PPTX
        </p>
      </footer>
    </div>
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