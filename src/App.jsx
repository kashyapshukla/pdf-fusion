import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import { mergePDFs } from './utils/pdfHandler';
import { Files, Download, Loader2 } from 'lucide-react';

function App() {
  const [files, setFiles] = useState([]);
  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = async () => {
    if (files.length === 0) return;
    setIsMerging(true);
    try {
      const mergedPdfBlob = await mergePDFs(files);
      const url = URL.createObjectURL(mergedPdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged-document-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert(error.message || 'Failed to merge PDFs. Please try again.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-6 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10">
          <Files className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
          PDF Fusion
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Securely combine multiple PDF files into one. Fast, private, and runs entirely in your browser.
        </p>
      </header>

      <main>
        <FileUploader files={files} onFilesChange={setFiles} />

        {files.length > 0 && (
          <div className="flex justify-center mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={handleMerge}
              disabled={isMerging}
              className="btn btn-primary text-lg px-8 py-3 w-full sm:w-auto"
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Merge & Download PDF
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
