'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  uploadDocument,
  ingestUrl,
  compareLinks,
  getDocuments,
  deleteDocument,
  DocumentInfo,
} from '@/lib/api';
import {
  UploadCloud,
  Link2,
  Layers,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science', 'Cybersecurity', 'Statistics',
  'Biotechnology', 'Electronics', 'Data Science',
  'Mathematics', 'Physics', 'Healthcare Analytics', 'Cross-Disciplinary'
];

export default function IngestionPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'link' | 'multi_compare'>('upload');
  
  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [fileDepartment, setFileDepartment] = useState('Computer Science');
  const [fileSource, setFileSource] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link Ingest State
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDepartment, setLinkDepartment] = useState('Computer Science');

  // Multi-Link Compare State
  const [compareUrls, setCompareUrls] = useState<string[]>(['', '']);
  const [compareDept, setCompareDept] = useState('Cross-Disciplinary');

  // Documents List State
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Operation State
  const [processing, setProcessing] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadStoredDocuments = () => {
    setLoadingDocs(true);
    getDocuments({ limit: 100 })
      .then(setDocuments)
      .catch((e) => console.error('Failed to load documents:', e))
      .finally(() => setLoadingDocs(false));
  };

  useEffect(() => {
    loadStoredDocuments();
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    setError('');
    setResult(null);
    setSuccessMsg('');
    const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    const allowed = ['.pdf', '.md', '.markdown', '.zip'];

    if (!allowed.includes(ext)) {
      setError(`Unsupported file type '${ext}'. Supported: PDF, Markdown (.md), or ZIP repository.`);
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File exceeds maximum size limit of 50MB.');
      return;
    }

    setFile(selectedFile);
    if (!fileTitle) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setFileTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  // 1. Submit File Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to ingest.');
      return;
    }

    setProcessing(true);
    setPipelineStage('Extracting text and structure...');
    setError('');
    setResult(null);
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', fileTitle || file.name);
    formData.append('department', fileDepartment);
    formData.append('source', fileSource || 'Local Upload');

    try {
      setTimeout(() => setPipelineStage('Extracting entities and graph links...'), 600);
      setTimeout(() => setPipelineStage('Generating 768-dim vector embeddings...'), 1200);
      setTimeout(() => setPipelineStage('Discovering cross-disciplinary connections...'), 1800);

      const res = await uploadDocument(formData);
      setResult(res);
      setSuccessMsg(`Document '${res.title}' ingested and integrated into knowledge graph!`);
      setFile(null);
      setFileTitle('');
      loadStoredDocuments();
    } catch (err: any) {
      setError(err.message || 'File upload failed.');
    } finally {
      setProcessing(false);
      setPipelineStage('');
    }
  };

  // 2. Submit Public Link Ingestion
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      setError('Please enter a valid document link.');
      return;
    }

    setProcessing(true);
    setPipelineStage('Fetching public document via HTTP...');
    setError('');
    setResult(null);
    setSuccessMsg('');

    try {
      setTimeout(() => setPipelineStage('Parsing text & extracting knowledge graph entities...'), 700);
      setTimeout(() => setPipelineStage('Generating embeddings & calculating similarity...'), 1400);

      const res = await ingestUrl({
        url: linkUrl.trim(),
        title: linkTitle.trim(),
        department: linkDepartment,
      });
      setResult(res);
      setSuccessMsg(`Public document from link successfully parsed and added to knowledge graph!`);
      setLinkUrl('');
      setLinkTitle('');
      loadStoredDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to ingest public link.');
    } finally {
      setProcessing(false);
      setPipelineStage('');
    }
  };

  // 3. Submit Multi-Link Comparison
  const handleCompareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validUrls = compareUrls.map((u) => u.trim()).filter((u) => u.length > 0);
    if (validUrls.length < 2) {
      setError('Please provide at least 2 public document links to compare.');
      return;
    }

    setProcessing(true);
    setPipelineStage('Ingesting multiple public documents...');
    setError('');
    setResult(null);
    setSuccessMsg('');

    try {
      setTimeout(() => setPipelineStage('Comparing cross-disciplinary methodologies & datasets...'), 1200);

      const res = await compareLinks({
        urls: validUrls,
        department: compareDept,
      });
      setResult(res);
      setSuccessMsg(`Ingested ${res.ingested_count} documents and synthesized connections!`);
      setCompareUrls(['', '']);
      loadStoredDocuments();
    } catch (err: any) {
      setError(err.message || 'Comparative link ingestion failed.');
    } finally {
      setProcessing(false);
      setPipelineStage('');
    }
  };

  // Delete Document
  const handleDeleteDocument = async (id: string, title: string) => {
    if (!confirm(`Remove '${title}' from the knowledge graph?`)) return;

    setDeletingId(id);
    setError('');
    setSuccessMsg('');

    try {
      await deleteDocument(id);
      setSuccessMsg(`Document '${title}' was successfully removed.`);
      loadStoredDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="pb-6 border-b border-[var(--border-subtle)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold mb-2">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>RESEARCH INGESTION ENGINE</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Ingest & Manage Sources
        </h1>
        <p className="text-xs lg:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
          Add research papers, theses, Markdown files or public repositories to the research ontology
        </p>
      </div>

      {/* Tabs with Defined Borders */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
        <button
          onClick={() => { setActiveTab('upload'); setError(''); setResult(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-1.5 shadow-sm ${
            activeTab === 'upload'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-400 shadow-indigo-500/30'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-indigo-500/40'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload File</span>
        </button>

        <button
          onClick={() => { setActiveTab('link'); setError(''); setResult(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-1.5 shadow-sm ${
            activeTab === 'link'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-400 shadow-indigo-500/30'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-indigo-500/40'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>Public Document Link</span>
        </button>

        <button
          onClick={() => { setActiveTab('multi_compare'); setError(''); setResult(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-1.5 shadow-sm ${
            activeTab === 'multi_compare'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-400 shadow-indigo-500/30'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-indigo-500/40'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Multi-Link Comparison</span>
        </button>
      </div>

      {/* 1. Upload File Tab */}
      {activeTab === 'upload' && (
        <form onSubmit={handleFileUpload} className="panel p-6 md:p-8 space-y-6 border-1.5 border-[var(--border-subtle)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                Document Title
              </label>
              <input
                type="text"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                placeholder="Derived from filename if blank"
                className="ui-input text-xs py-2.5 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                Faculty / Department
              </label>
              <select
                value={fileDepartment}
                onChange={(e) => setFileDepartment(e.target.value)}
                className="ui-input text-xs py-2.5 font-medium"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dropzone with Defined Border */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10 shadow-lg'
                : file
                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg'
                : 'border-[var(--border-medium)] hover:border-indigo-400 bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.md,.markdown,.zip"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-1.5">
                <FileText className="w-10 h-10 text-emerald-400 mb-1" />
                <p className="text-sm font-bold text-[var(--text-primary)]">{file.name}</p>
                <p className="text-xs font-mono text-[var(--text-muted)]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Ready for ingestion
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-xs text-[var(--danger)] hover:underline mt-2 font-bold"
                >
                  Remove selected file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <UploadCloud className="w-10 h-10 text-indigo-400 mb-1" />
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Drop research paper, or <span className="text-[var(--accent)] underline">browse</span>
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  PDF, Markdown (.md), or ZIP repository up to 50MB
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">Parsed into passive embeddings & entity graph.</span>
            <button
              type="submit"
              disabled={processing || !file}
              className="btn-primary text-xs py-2.5 px-5 disabled:opacity-40"
            >
              {processing ? 'Processing...' : 'Ingest & Extract Graph'}
            </button>
          </div>
        </form>
      )}

      {/* 2. Public Link Tab */}
      {activeTab === 'link' && (
        <form onSubmit={handleLinkSubmit} className="panel p-6 md:p-8 space-y-6 border-1.5 border-[var(--border-subtle)]">
          <div className="p-4 rounded-xl bg-indigo-500/10 border-1.5 border-indigo-500/25 flex items-start gap-3 text-xs text-[var(--text-secondary)]">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--text-primary)]">Public URL:</strong> Enter a direct link to a document publicly accessible without login (e.g. arXiv PDF, raw GitHub markdown, open-access university journals).
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
              Public Document URL
            </label>
            <input
              type="url"
              required
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://arxiv.org/pdf/2401.12345.pdf or https://raw.githubusercontent.com/.../paper.md"
              className="ui-input text-xs py-2.5 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                Custom Title (Optional)
              </label>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Derived from URL if blank"
                className="ui-input text-xs py-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                Faculty / Department
              </label>
              <select
                value={linkDepartment}
                onChange={(e) => setLinkDepartment(e.target.value)}
                className="ui-input text-xs py-2.5 font-medium"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">Automated public HTTP parser.</span>
            <button
              type="submit"
              disabled={processing || !linkUrl.trim()}
              className="btn-primary text-xs py-2.5 px-5 disabled:opacity-40"
            >
              {processing ? 'Fetching & Parsing...' : 'Ingest Public Document'}
            </button>
          </div>
        </form>
      )}

      {/* 3. Multi-Link Comparison Tab */}
      {activeTab === 'multi_compare' && (
        <form onSubmit={handleCompareSubmit} className="panel p-6 md:p-8 space-y-6 border-1.5 border-[var(--border-subtle)]">
          <div className="p-4 rounded-xl bg-purple-500/10 border-1.5 border-purple-500/25 flex items-start gap-3 text-xs text-[var(--text-secondary)]">
            <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--text-primary)]">Multi-Source Comparison:</strong> Ingest 2–5 public links simultaneously to calculate direct methodological and algorithmic overlap.
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">
              Document URLs to Compare (2–5 links)
            </label>
            {compareUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[var(--text-muted)] w-6">#{idx + 1}</span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...compareUrls];
                    newUrls[idx] = e.target.value;
                    setCompareUrls(newUrls);
                  }}
                  placeholder={`https://example.edu/paper_${idx + 1}.pdf`}
                  className="ui-input text-xs py-2.5 font-mono flex-1"
                />
                {compareUrls.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setCompareUrls(compareUrls.filter((_, i) => i !== idx))}
                    className="p-2 text-[var(--danger)] hover:bg-rose-500/10 rounded-lg text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {compareUrls.length < 5 && (
              <button
                type="button"
                onClick={() => setCompareUrls([...compareUrls, ''])}
                className="text-xs text-indigo-400 hover:underline font-bold mt-1"
              >
                + Add another link
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
              Department Classification
            </label>
            <select
              value={compareDept}
              onChange={(e) => setCompareDept(e.target.value)}
              className="ui-input text-xs py-2.5 w-64 font-medium"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">Cross-link graph calculation.</span>
            <button
              type="submit"
              disabled={processing || compareUrls.filter((u) => u.trim().length > 0).length < 2}
              className="btn-primary text-xs py-2.5 px-5 disabled:opacity-40"
            >
              {processing ? 'Synthesizing...' : 'Compare & Synthesize Links'}
            </button>
          </div>
        </form>
      )}

      {/* Ingestion Pipeline Visualization */}
      {processing && (
        <div className="panel p-6 space-y-4 bg-[var(--bg-surface-elevated)] border-1.5 border-indigo-500/40 shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-400">{pipelineStage}</span>
            <div className="w-4 h-4 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
          <div className="grid grid-cols-4 gap-3 text-xs font-bold text-[var(--text-muted)]">
            <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center">
              1. Extraction
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center">
              2. Entities
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center">
              3. Embeddings
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center">
              4. Graph Links
            </div>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border-1.5 border-rose-500/30 text-xs text-rose-300 font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border-1.5 border-emerald-500/30 text-xs text-emerald-300 font-medium flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <Link href="/graph" className="btn-primary text-xs py-1 px-3 ml-2">
            View Graph →
          </Link>
        </div>
      )}

      {/* Stored Documents Management Table */}
      <section className="panel p-6 md:p-8 space-y-4 border-1.5 border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Stored Research Papers & Sources ({documents.length})
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Manage indexed documents or remove obsolete entries from the knowledge graph
            </p>
          </div>
          <button onClick={loadStoredDocuments} className="btn-ghost text-xs py-1.5 px-3">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loadingDocs ? (
          <div className="space-y-2.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-[var(--bg-surface-elevated)] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-4 text-center">No documents in the knowledge graph.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase text-[10px] font-bold">
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Faculty</th>
                  <th className="pb-3 font-semibold">Source</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[var(--bg-surface-elevated)]/60 transition-colors">
                    <td className="py-3.5 font-bold text-[var(--text-primary)] max-w-xs truncate pr-4">
                      {doc.title}
                    </td>
                    <td className="py-3.5 text-[var(--text-secondary)] font-medium">
                      {doc.department}
                    </td>
                    <td className="py-3.5 font-mono text-[11px] text-[var(--text-muted)] truncate max-w-[140px]">
                      {doc.source?.startsWith('http') ? 'URL link' : doc.document_type}
                    </td>
                    <td className="py-3.5 font-mono text-[11px] text-[var(--text-muted)]">
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        disabled={deletingId === doc.id}
                        className="px-2.5 py-1 rounded-md text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 transition-colors disabled:opacity-40"
                      >
                        {deletingId === doc.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
