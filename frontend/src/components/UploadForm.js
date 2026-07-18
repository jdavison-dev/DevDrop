'use client';

import { useState, useRef } from 'react';
import { Upload, File, Shield, Clock, Loader2, CheckCircle2, Copy } from 'lucide-react';

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [downloadLimit, setDownloadLimit] = useState('0');
  const [expiryHours, setExpiryHours] = useState('24');
  
  // New operational states
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    if (status === 'idle') fileInputRef.current.click();
  };

  // The Core Orchestration Function
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setStatus('uploading');

    try {
      // 1. Ask our backend for the pre-signed S3 URL and log metadata in MongoDB
      // Assuming backend is running on localhost:5000
      const backendRes = await fetch('http://localhost:5000/api/files/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalName: file.name,
          downloadLimit: parseInt(downloadLimit),
          expiryHours: parseInt(expiryHours)
        })
      });

      if (!backendRes.ok) throw new Error('Failed to get secure upload link from server.');

      const { uploadUrl, fileId } = await backendRes.json();

      // 2. Upload the raw binary file DIRECTLY to AWS S3 using the pre-signed URL
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });

      if (!s3Res.ok) throw new Error('Failed to stream file payload directly to cloud storage.');

      // 3. Construct the clean public download link that handles lifecycle checks
      const shareableLink = `http://localhost:5000/api/files/download/${fileId}`;
      setGeneratedLink(shareableLink);
      setStatus('success');

    } catch (err) {
      console.error('Upload sequence exception:', err);
      setStatus('error');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setFile(null);
    setStatus('idle');
    setGeneratedLink('');
  };

  // UI STATE: Success Layout
  if (status === 'success') {
    return (
      <div className="w-full max-w-xl p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
        <div className="p-4 mb-4 bg-green-950/40 border border-green-900 text-green-400 rounded-full">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-100">Secure Link Generated!</h3>
        <p className="mt-2 text-sm text-slate-400 max-w-sm">
          Your file is safely encrypted in transit. Share this gatekeeper URL. It will automatically disintegrate based on your constraints.
        </p>

        <div className="mt-6 w-full flex gap-2 bg-slate-950 border border-slate-800 p-2 rounded-xl items-center">
          <input
            type="text"
            readOnly
            value={generatedLink}
            className="flex-1 bg-transparent px-2 text-xs text-slate-300 font-mono focus:outline-none truncate"
          />
          <button
            onClick={copyToClipboard}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            {copied ? 'Copied!' : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy
              </>
            )}
          </button>
        </div>

        <button
          onClick={resetForm}
          className="mt-6 text-xs text-slate-500 hover:text-slate-400 underline decoration-dashed"
        >
          Drop another file
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative group flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-200 min-h-[220px] ${
          status === 'uploading' ? 'border-slate-800 bg-slate-950/20 cursor-wait' :
          isDragActive ? 'border-blue-500 bg-blue-950/30 cursor-pointer' : 
          'border-slate-700 bg-slate-950/40 hover:border-slate-500 hover:bg-slate-950/60 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          disabled={status === 'uploading'}
        />

        {status === 'uploading' ? (
          <div className="flex flex-col items-center text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-200">Streaming payload to cloud tier...</p>
            <p className="mt-1 text-xs text-slate-500 font-mono">Do not close window</p>
          </div>
        ) : !file ? (
          <div className="flex flex-col items-center text-center pointer-events-none">
            <div className="p-4 mb-4 bg-slate-900 border border-slate-800 rounded-full text-slate-400 group-hover:text-blue-400 transition-colors">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-slate-200">
              Drag and drop your file here, or <span className="text-blue-500 font-semibold">browse</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">Any file size up to S3 constraints</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="p-4 mb-4 bg-blue-950/50 border border-blue-900 text-blue-400 rounded-full pointer-events-none">
              <File className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-200 max-w-[280px] truncate pointer-events-none">
              {file.name}
            </p>
            <p className="mt-1 text-xs text-slate-500 pointer-events-none">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="mt-4 text-xs font-medium text-red-400 hover:text-red-300 bg-slate-950/80 px-3 py-1.5 rounded-md border border-slate-800 z-20"
            >
              Remove file
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5 text-blue-500" /> Download Limit
            </label>
            <select
              value={downloadLimit}
              disabled={status === 'uploading'}
              onChange={(e) => setDownloadLimit(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
            >
              <option value="0">Unlimited downloads</option>
              <option value="1">1 download (Single use)</option>
              <option value="5">5 downloads</option>
              <option value="10">10 downloads</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Expiry Time
            </label>
            <select
              value={expiryHours}
              disabled={status === 'uploading'}
              onChange={(e) => setExpiryHours(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
            >
              <option value="1">1 Hour</option>
              <option value="2">2 Hours</option>
              <option value="12">12 Hours</option>
              <option value="24">24 Hours (1 Day)</option>
              <option value="72">72 Hours (3 Days)</option>
            </select>
          </div>
        </div>

        {status === 'error' && (
          <p className="text-xs text-red-400 font-medium text-center">
            ❌ An operational error occurred. Check browser dev console or server CORS block.
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!file || status === 'uploading'}
          className={`w-full font-semibold text-sm py-3 px-4 rounded-xl transition-all duration-200 mt-2 ${
            file && status !== 'uploading'
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 active:scale-[0.99]' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          Generate Secure Drop Link
        </button>
      </div>
    </div>
  );
}