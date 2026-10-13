import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { scanOfferLetter, OfferScanResponse, describeApiError } from '../services/api';
import { ResumeScorer } from './ResumeScorer';

interface Props {
  initialDocumentType?: 'offer-letter' | 'resume-score';
  onSwitchToResume?: () => void;
}

export const OfferLetterScanner: React.FC<Props> = ({ initialDocumentType = 'offer-letter', onSwitchToResume }) => {
  const [docType, setDocType] = useState<'offer-letter' | 'resume-score'>(initialDocumentType);
  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>('upload');

  useEffect(() => {
    if (initialDocumentType) {
      setDocType(initialDocumentType);
    }
  }, [initialDocumentType]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [extractedOcrText, setExtractedOcrText] = useState<string>('');
  const [showOcrText, setShowOcrText] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OfferScanResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const isImageFile = (file: File) => {
    return file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);
  };

  const isAllowedFile = (file: File) => {
    const name = file.name.toLowerCase();
    return (
      name.endsWith('.pdf') ||
      name.endsWith('.txt') ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.webp') ||
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      file.type === 'text/plain'
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const onSelectFile = (file: File) => {
    if (isAllowedFile(file)) {
      setSelectedFile(file);
      setError(null);
      if (isImageFile(file)) {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        const url = URL.createObjectURL(file);
        setImagePreviewUrl(url);
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = url;
      } else {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
        setImageDimensions(null);
      }
    } else {
      setError('Please upload a valid PDF (.pdf), Photo / Image (.jpg, .png, .jpeg, .webp), or Text (.txt) offer letter.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onSelectFile(e.target.files[0]);
    }
  };

  const handleScan = async () => {
    setError(null);
    if (activeMode === 'upload' && !selectedFile) {
      setError('Please select or drag-and-drop an offer letter (PDF, photo/image, or text) to scan.');
      return;
    }
    if (activeMode === 'paste' && (!pastedText.trim() || pastedText.trim().length < 20)) {
      setError('Please paste the full text of your offer letter (minimum 20 characters).');
      return;
    }

    setLoading(true);
    setOcrProgress(0);
    try {
      let ocrText = '';
      if (activeMode === 'upload' && selectedFile && isImageFile(selectedFile)) {
        setOcrStatusText('Initializing Optical Character Recognition (OCR)...');
        setOcrProgress(5);
        try {
          const { data } = await Tesseract.recognize(selectedFile, 'eng', {
            logger: (m) => {
              if (m.status === 'recognizing text' && typeof m.progress === 'number') {
                setOcrProgress(Math.round(m.progress * 100));
                setOcrStatusText(`OCR Scanning Document: ${Math.round(m.progress * 100)}%`);
              } else if (m.status) {
                setOcrStatusText(`AI Engine: ${m.status.replace(/_/g, ' ')}...`);
              }
            }
          });
          ocrText = data.text || '';
          setExtractedOcrText(ocrText);
        } catch (ocrErr: any) {
          console.warn('Browser OCR error:', ocrErr);
        }
      }

      const input = activeMode === 'upload' ? selectedFile! : pastedText;
      const res = await scanOfferLetter(input, ocrText);
      setResult(res);
    } catch (err: any) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
      setOcrStatusText('');
      setOcrProgress(0);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSelectedFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setImageDimensions(null);
    setPastedText('');
    setExtractedOcrText('');
    setShowOcrText(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (docType === 'resume-score') {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn">
        {/* Top Segmented Mode Switcher */}
        <div className="flex p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl gap-2 shadow-xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setDocType('offer-letter')}
            className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          >
            <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>Verify Offer Letter</span>
          </button>
          <button
            type="button"
            onClick={() => setDocType('resume-score')}
            className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Score Resume / CV</span>
          </button>
        </div>

        <ResumeScorer onSwitchToOfferScan={() => setDocType('offer-letter')} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Segmented Mode Switcher */}
      <div className="flex p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl gap-2 shadow-xl backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setDocType('offer-letter')}
          className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span>Verify Offer Letter</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (onSwitchToResume) onSwitchToResume();
            setDocType('resume-score');
          }}
          className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        >
          <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span>Score Resume / CV</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>AI Document Forensics</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Offer Letter Fraud Scanner
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Upload your appointment or offer letter to instantly detect fake security deposit demands, generic webmail HR accounts, stamp paper extortion, and corporate impersonation.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 self-stretch sm:self-auto">
            <button
              onClick={() => { setActiveMode('upload'); setError(null); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'upload'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload PDF / Photo
            </button>
            <button
              onClick={() => { setActiveMode('paste'); setError(null); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'paste'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paste Text
            </button>
          </div>
        </div>
      </div>

      {/* Switch to Resume Scorer Banner */}
      {onSwitchToResume && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/20 shadow-lg">
          <div className="flex items-center gap-3 text-indigo-200">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Looking to audit your Resume / CV instead?</p>
              <p className="text-[11px] text-slate-400">Score ATS readability, impact metrics, action verbs, and check for Aadhaar/PAN privacy leaks.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSwitchToResume}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Score Resume</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      )}

      {!result ? (
        /* Upload / Input Card */
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
              <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {activeMode === 'upload' ? (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/20 scale-[0.99]'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-slate-700/80 bg-slate-950/50 hover:border-cyan-500/50 hover:bg-slate-950/80'
                }`}
              >
                {selectedFile && imagePreviewUrl ? (
                  /* Photo / Image Preview Thumbnail */
                  <div className="space-y-4 max-w-sm mx-auto">
                    <div className="relative rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950 max-h-56 flex items-center justify-center">
                      <img
                        src={imagePreviewUrl}
                        alt="Offer Letter Document Preview"
                        className="max-h-52 w-auto object-contain rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-100 truncate">
                        {selectedFile.name}
                      </p>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          Photo / Image Document
                        </span>
                        {imageDimensions && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {imageDimensions.width}x{imageDimensions.height} px
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 pt-1">
                        AI OCR will automatically read text, clauses, and company signatures from this photo.
                      </p>
                    </div>
                  </div>
                ) : selectedFile ? (
                  /* Document File (PDF / TXT) */
                  <>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <path d="m9 15 2 2 4-4"/>
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-slate-200">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB — Ready for AI Forensic Analysis
                      </p>
                    </div>
                  </>
                ) : (
                  /* Empty Dropzone: Supports PDF and Photos */
                  <>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30">
                      <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-slate-200">
                        Click to upload or drag & drop Offer Letter or Photo
                      </p>
                      <p className="text-xs text-slate-400">
                        Supports PDF (.pdf), Photos / Screenshots (.jpg, .png, .jpeg, .webp), and Plain Text (.txt) up to 10MB
                      </p>
                    </div>
                  </>
                )}

                {selectedFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (imagePreviewUrl) {
                        URL.revokeObjectURL(imagePreviewUrl);
                        setImagePreviewUrl(null);
                      }
                      setImageDimensions(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 underline font-medium"
                  >
                    Remove File
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Offer Letter Text / Email Body
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the full offer letter content, salary details, joining instructions, and recruiter email address here..."
                rows={10}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-mono leading-relaxed"
              />
              <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                <span>Supports full offer letters, email transcripts & joining letters</span>
                <span>{pastedText.length} characters</span>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleScan}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 focus:ring-4 focus:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 transition-all duration-300 flex flex-col items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{ocrStatusText || 'Forensic AI Engine Scanning Offer Letter...'}</span>
                  </div>
                  {ocrProgress > 0 && (
                    <div className="w-full max-w-xs bg-slate-900/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full transition-all duration-300"
                        style={{ width: `${ocrProgress}%` }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                  <span>Analyze Offer Letter Legitimacy</span>
                </div>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6 animate-fadeIn">
          {/* Top Verdict Banner */}
          <div
            className={`rounded-2xl p-6 sm:p-8 border shadow-2xl relative overflow-hidden ${
              result.verdict === 'GENUINE'
                ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-500/40 shadow-emerald-950/30'
                : result.verdict === 'SCANNED_DOCUMENT_REVIEW' || result.is_scanned_image
                ? 'bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-950 border-amber-500/40 shadow-amber-950/30'
                : result.verdict === 'SUSPICIOUS'
                ? 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border-amber-500/40 shadow-amber-950/30'
                : 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 border-rose-500/40 shadow-rose-950/40'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-3 h-3 rounded-full animate-pulse ${
                      result.verdict === 'GENUINE'
                        ? 'bg-emerald-400'
                        : result.verdict === 'SCANNED_DOCUMENT_REVIEW' || result.is_scanned_image
                        ? 'bg-amber-400'
                        : result.verdict === 'SUSPICIOUS'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                    {result.is_photo
                      ? 'Photo / Image Forensic Analysis'
                      : result.is_scanned_image
                      ? 'Scanned Document Forensics'
                      : 'Forensic Verdict'}
                  </span>
                </div>
                <h3
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    result.verdict === 'GENUINE'
                      ? 'text-emerald-300'
                      : result.verdict === 'SCANNED_DOCUMENT_REVIEW' || result.is_scanned_image
                      ? 'text-amber-300'
                      : result.verdict === 'SUSPICIOUS'
                      ? 'text-amber-300'
                      : 'text-rose-300'
                  }`}
                >
                  {result.status_label}
                </h3>
                <p className="text-sm text-slate-300 max-w-lg">
                  {result.verdict === 'GENUINE'
                    ? 'No predatory clauses or suspicious fee demands detected. Always verify salary terms and physical workplace.'
                    : result.is_photo && result.verdict === 'SCANNED_DOCUMENT_REVIEW'
                    ? 'The uploaded file is a photo/screenshot without embedded digital vector fonts. Fake job syndicates frequently share appointment letters on WhatsApp or Telegram as photos to bypass automated scanners. Review the visual forensics below.'
                    : result.verdict === 'SCANNED_DOCUMENT_REVIEW' || result.is_scanned_image
                    ? 'The uploaded document contains scanned raster images without selectable vector text layers. Many scam networks use scanned bitmaps to evade automated fraud detectors. Review the document forensics below, or paste the text directly.'
                    : result.verdict === 'SUSPICIOUS'
                    ? 'Several caution indicators were flagged. Contact HR through official website channels before signing.'
                    : 'CRITICAL WARNING: This document exhibits high-probability recruitment fraud signatures. Never pay any fees.'}
                </p>

                {result.is_scanned_image && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResult(null);
                        setSelectedFile(null);
                        setActiveMode('paste');
                        setError(null);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      <span>Have Offer Email / Text? Switch to Paste Mode</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Legitimacy Score Circle */}
              <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shrink-0">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        result.legitimacy_score >= 70
                          ? 'text-emerald-400'
                          : result.legitimacy_score >= 40
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }
                      strokeDasharray={`${result.legitimacy_score}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-100">
                      {result.legitimacy_score}%
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase">Legitimacy Score</div>
                  <div className="text-sm font-bold text-slate-200">
                    {result.is_scanned_image
                      ? 'Requires Manual Caution'
                      : result.legitimacy_score >= 70
                      ? 'High Confidence'
                      : result.legitimacy_score >= 40
                      ? 'Moderate Caution'
                      : 'Severe Fraud Risk'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Details Grid */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              <span>Extracted Document Entities</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Issuer / Company</div>
                <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
                  {result.extracted_details.company_name || 'Not Detected'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Role / Designation</div>
                <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
                  {result.extracted_details.job_title || 'Not Specified'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Offered CTC / Salary</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1 truncate">
                  {result.extracted_details.salary || 'Not Mentioned'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Detected Recruiter Email</div>
                <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
                  {result.extracted_details.emails.length > 0
                    ? result.extracted_details.emails.join(', ')
                    : 'No Email Found'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Government MCA CIN</div>
                <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
                  {result.extracted_details.cin || 'No CIN In Letter'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="text-xs text-slate-400">Document Size & Format</div>
                <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
                  {result.extracted_details.file_size_kb
                    ? `${result.extracted_details.file_size_kb} KB ${
                        result.extracted_details.image_dimensions
                          ? `(${result.extracted_details.image_dimensions})`
                          : result.is_photo
                          ? '(Photo Graphic)'
                          : result.is_scanned_image
                          ? '(Scanned PDF)'
                          : ''
                      }`
                    : `${result.extracted_details.char_count} characters`}
                </div>
              </div>
            </div>
          </div>

          {/* Extracted OCR Text Preview Toggle */}
          {(extractedOcrText || (result.raw_text_preview && !result.raw_text_preview.startsWith('['))) && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="9" x2="15" y2="9"/>
                    <line x1="9" y1="13" x2="15" y2="13"/>
                    <line x1="9" y1="17" x2="13" y2="17"/>
                  </svg>
                  <span>Extracted OCR / Document Text</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowOcrText(!showOcrText)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  {showOcrText ? 'Hide Text' : 'View Extracted Text'}
                </button>
              </div>

              {showOcrText && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed animate-fadeIn">
                  {extractedOcrText || result.raw_text_preview}
                </div>
              )}
            </div>
          )}

          {/* Red & Green Flags Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Red Flags */}
            <div className="bg-slate-900/80 border border-rose-500/20 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Red Flags & Suspicious Signals ({result.red_flags.length})</span>
              </h4>
              {result.red_flags.length > 0 ? (
                <ul className="space-y-2.5">
                  {result.red_flags.map((flag, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-rose-200 bg-rose-950/30 border border-rose-900/40 p-3 rounded-xl flex items-start gap-2.5"
                    >
                      <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18"/>
                        <path d="m6 6 12 12"/>
                      </svg>
                      <span className="leading-relaxed">{flag}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-950 p-4 rounded-xl text-center">
                  No explicit red flags detected in scanned text.
                </div>
              )}
            </div>

            {/* Green Flags */}
            <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>Legitimate Verification Indicators ({result.green_flags.length})</span>
              </h4>
              {result.green_flags.length > 0 ? (
                <ul className="space-y-2.5">
                  {result.green_flags.map((flag, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-emerald-200 bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-xl flex items-start gap-2.5"
                    >
                      <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span className="leading-relaxed">{flag}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-950 p-4 rounded-xl text-center">
                  Limited positive signals found. Proceed with standard verification.
                </div>
              )}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>Recommended Candidate Actions</span>
            </h4>
            <div className="space-y-2">
              {result.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 leading-relaxed"
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-2 text-center">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold tracking-wide transition-all border border-slate-700 shadow-md"
            >
              <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
              <span>Scan Another Offer Letter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
