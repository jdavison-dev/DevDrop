'use client';

import { useEffect, useState, use } from 'react';
import { File, Download, AlertTriangle, Clock, ShieldCheck, Loader2 } from 'lucide-react';

export default function DownloadPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const fileId = params.id;

  const [fileData, setFileData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, ready, error, downloading
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch metadata on load WITHOUT burning a download
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/files/metadata/${fileId}`);
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'This file link has expired or is invalid.');
        }

        const data = await res.json();
        setFileData(data);
        setStatus('ready');
      } catch (err) {
        setErrorMessage(err.message);
        setStatus('error');
      }
    };

    if (fileId) fetchMetadata();
  }, [fileId]);

  // 2. Handle actual download request when button is clicked
const handleDownload = async () => {
  setStatus('downloading');

  try {
    const res = await fetch(`http://localhost:5000/api/files/download/${fileId}`);
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Download quota exhausted or link expired.');
    }

    const { downloadUrl } = await res.json();

    // 1. Fetch file directly as a Blob to bypass cross-origin browser navigation
    const fileResponse = await fetch(downloadUrl);
    const blob = await fileResponse.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    // 2. Trigger instant download from local memory
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileData?.originalName || 'download';
    document.body.appendChild(link);
    link.click();
    
    // 3. Cleanup memory
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    // Update state locally
    if (typeof fileData.remainingDownloads === 'number') {
      const updatedCount = fileData.remainingDownloads - 1;
      
      if (updatedCount <= 0) {
        setStatus('error');
        setErrorMessage('Download limit reached. This link is now expired.');
        return;
      }

      setFileData(prev => ({ ...prev, remainingDownloads: updatedCount }));
    }

    setStatus('ready');
  } catch (err) {
    setErrorMessage(err.message);
    setStatus('error');
  }
};

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-6">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="mt-4 text-sm text-slate-400 font-medium">Validating security constraints...</p>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-6">
        <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col items-center text-center">
          <div className="p-4 mb-4 bg-red-950/40 border border-red-900 text-red-400 rounded-full">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-100">Link Inaccessible</h3>
          <p className="mt-2 text-sm text-slate-400">{errorMessage}</p>
          <a
            href="/"
            className="mt-6 text-xs bg-slate-950 border border-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go to DevDrop Workspace
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-6">
      <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative z-10">
        <div className="flex items-center gap-4 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl mb-6">
          <div className="p-3 bg-blue-950/40 border border-blue-900/50 text-blue-400 rounded-lg shrink-0">
            <File className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">
              {fileData?.originalName || 'Shared Asset'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Ready for secure pickup</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs border-b border-slate-800/60 pb-2">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Availability window
            </span>
            <span className="text-slate-300 font-medium">Active Token</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Remaining Downloads
            </span>
            <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
              fileData?.remainingDownloads === 'unlimited' 
                ? 'bg-green-950 text-green-400 border border-green-900/30'
                : 'bg-blue-950 text-blue-400 border border-blue-900/30'
            }`}>
              {fileData?.remainingDownloads}
            </span>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={status === 'downloading'}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-900/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
        >
          {status === 'downloading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Fetching Payload...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Download Secure File
            </>
          )}
        </button>
      </div>
    </main>
  );
}