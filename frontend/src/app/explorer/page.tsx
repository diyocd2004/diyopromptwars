'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDocuments, searchResearch, DocumentInfo, SearchResults } from '@/lib/api';
import {
  Search,
  FileText,
  UploadCloud,
  ArrowRight,
} from 'lucide-react';

const DEPARTMENTS = [
  'All', 'Cybersecurity', 'Statistics', 'Biotechnology', 'Data Science', 'Electronics', 'Computer Science'
];

export default function ExplorerPage() {
  return (
    <Suspense fallback={<div className="panel p-8 text-center text-xs text-[var(--text-muted)]">Loading Research Explorer...</div>}>
      <ExplorerInner />
    </Suspense>
  );
}

function ExplorerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [selectedDept, setSelectedDept] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Sync with URL query parameter
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
      executeSearch(q);
    } else {
      fetchDocs();
    }
  }, [searchParams, selectedDept]);

  const fetchDocs = () => {
    setLoading(true);
    const params: Record<string, string> = { limit: '60' };
    if (selectedDept !== 'All') {
      params.department = selectedDept;
    }
    getDocuments(params)
      .then(setDocuments)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) {
      setSearchResults(null);
      fetchDocs();
      return;
    }
    setSearching(true);
    try {
      const res = await searchResearch(queryText);
      setSearchResults(res);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explorer?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/explorer');
      setSearchResults(null);
      fetchDocs();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Header & Search Bar */}
      <div className="space-y-4 pb-6 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-[var(--accent)] uppercase mb-1">
              FACULTY RESEARCH DISCOVERY
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Research Explorer
            </h1>
            <p className="text-xs lg:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
              Explore university papers, theses, and repositories with 768-dim semantic search
            </p>
          </div>
          <Link href="/ingestion" className="btn-secondary text-xs">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>+ Ingest Research</span>
          </Link>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, methodology, algorithm, or author..."
              className="ui-input pl-10 pr-9 py-2 text-xs bg-[var(--bg-surface)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); router.push('/explorer'); setSearchResults(null); fetchDocs(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button type="submit" disabled={searching} className="btn-primary text-xs py-2 px-4 shrink-0">
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Department Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-[var(--text-muted)] mr-1 shrink-0">Faculty:</span>
        {DEPARTMENTS.map((dept) => {
          const isSelected = selectedDept === dept;
          return (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                isSelected
                  ? 'bg-[var(--accent)] text-white border-indigo-500 shadow-sm'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]'
              }`}
            >
              {dept}
            </button>
          );
        })}
      </div>

      {/* Search Results Mode */}
      {searchResults ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Results for "{searchResults.query}" ({searchResults.documents.length} papers, {searchResults.entities.length} entities)</span>
            <button
              onClick={() => { setSearchResults(null); setSearchQuery(''); router.push('/explorer'); fetchDocs(); }}
              className="text-indigo-400 hover:underline font-bold"
            >
              Clear search
            </button>
          </div>

          {/* Matched Entities */}
          {searchResults.entities.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Matched Concepts in Knowledge Graph
              </span>
              <div className="flex flex-wrap gap-1.5">
                {searchResults.entities.map((e) => (
                  <span
                    key={e.id}
                    className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[11px] font-medium"
                  >
                    {e.name} <span className="text-[9px] text-[var(--text-muted)] font-normal">({e.type.replace(/_/g, ' ')})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Document list */}
          <div className="space-y-3">
            {searchResults.documents.map((doc) => (
              <article key={doc.id} className="panel panel-hover p-5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-surface-elevated)] text-[var(--accent)] border border-[var(--border-subtle)]">
                    {doc.department || 'General'}
                  </span>
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    {Math.round(doc.similarity * 100)}% match
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                  {doc.title}
                </h3>

                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {doc.content_preview}
                </p>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span className="truncate max-w-[240px]">
                    {doc.authors?.join(', ') || 'Faculty Research'}
                  </span>
                  <Link
                    href={`/assistant?q=${encodeURIComponent(`Tell me about '${doc.title}' and its cross-disciplinary connections`)}`}
                    className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Query in Assistant</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        /* Regular Browse Mode */
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] animate-pulse" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="panel p-12 text-center">
              <p className="text-xs text-[var(--text-muted)]">No research papers indexed for this department.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <article key={doc.id} className="panel panel-hover p-5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-surface-elevated)] text-[var(--accent)] border border-[var(--border-subtle)]">
                    {doc.department || 'General'}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                    {doc.document_type}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                  {doc.title}
                </h3>

                {doc.authors && doc.authors.length > 0 && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Authors: {doc.authors.join(', ')}
                  </p>
                )}

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Active'}
                  </span>
                  <Link
                    href="/graph"
                    className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View in Knowledge Graph</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
