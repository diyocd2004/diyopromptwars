'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getConnections, InsightData } from '@/lib/api';
import {
  GitBranch,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

const CONNECTION_TYPES: Record<string, { label: string }> = {
  all: { label: 'All Connections' },
  cross_department: { label: 'Cross-Department' },
  shared_algorithm: { label: 'Shared Algorithm' },
  shared_dataset: { label: 'Shared Dataset' },
  shared_methodology: { label: 'Shared Methodology' },
  same_domain: { label: 'Domain Synergy' },
};

export default function HiddenConnectionsPage() {
  const [connections, setConnections] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [minScore, setMinScore] = useState(0.2);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    setLoading(true);
    getConnections(minScore)
      .then(setConnections)
      .catch((e) => setError(e.message || 'Failed to fetch connections'))
      .finally(() => setLoading(false));
  }, [minScore]);

  const filtered = connections.filter((c) => {
    if (selectedType === 'all') return true;
    return c.connection_type === selectedType;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-[var(--accent)] uppercase mb-1">
            CROSS-FACULTY SYNERGY RADAR
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Hidden Research Connections
          </h1>
          <p className="text-xs lg:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
            Potential cross-disciplinary relationships discovered across the research ontology
          </p>
        </div>

        {/* Score Filter */}
        <div className="flex items-center gap-3 bg-[var(--bg-surface)] p-1.5 rounded-xl border border-[var(--border-subtle)]">
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-[var(--text-muted)] font-semibold">Confidence:</span>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="ui-input py-1 px-2.5 text-xs w-32 bg-[var(--bg-surface-elevated)] border-0 font-medium"
          >
            <option value={0.2}>20% + (All)</option>
            <option value={0.4}>40% + (Moderate)</option>
            <option value={0.6}>60% + (Strong)</option>
            <option value={0.8}>80% + (Highest)</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {Object.entries(CONNECTION_TYPES).map(([key, info]) => {
          const isSelected = selectedType === key;
          const count = key === 'all' ? connections.length : connections.filter((c) => c.connection_type === key).length;
          return (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                isSelected
                  ? 'bg-[var(--accent)] text-white border-indigo-500 shadow-sm'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]'
              }`}
            >
              <span>{info.label}</span>
              <span className="text-[10px] opacity-75 ml-1">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Ranked Discovery List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="panel p-10 text-center border-rose-500/30">
          <p className="text-sm font-bold text-[var(--danger)] mb-2">Error loading connections</p>
          <p className="text-xs text-[var(--text-muted)]">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel p-14 text-center space-y-4 border-[var(--border-subtle)]">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">No connections match this filter</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-4">
            Try selecting a lower confidence threshold to explore wider cross-disciplinary ties.
          </p>
          <button onClick={() => setMinScore(0.2)} className="btn-secondary text-xs">
            Reset Threshold to 20%
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((conn) => {
            const scorePct = Math.round(conn.similarity_score * 100);

            return (
              <article
                key={conn.id}
                className="panel panel-hover p-6 space-y-4"
              >
                {/* Header row */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-[var(--border-subtle)]">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 uppercase tracking-wider">
                    {conn.connection_type?.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono font-bold text-xs text-emerald-400">
                    {scorePct}% similarity
                  </span>
                </div>

                {/* Horizontal Research Relationship Flow */}
                <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center py-1">
                  {/* Paper A */}
                  <div className="md:col-span-5 p-3.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider">
                      {conn.source_document?.department || 'Faculty A'}
                    </span>
                    <h3 className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                      {conn.source_document?.title}
                    </h3>
                  </div>

                  {/* Bridge Indicator */}
                  <div className="md:col-span-1 flex justify-center text-[var(--text-muted)]">
                    <ArrowRight className="w-4 h-4 hidden md:block" />
                    <span className="text-sm md:hidden font-mono text-center block">↕</span>
                  </div>

                  {/* Paper B */}
                  <div className="md:col-span-5 p-3.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider">
                      {conn.target_document?.department || 'Faculty B'}
                    </span>
                    <h3 className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                      {conn.target_document?.title}
                    </h3>
                  </div>
                </div>

                {/* Explanation */}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {conn.explanation}
                </p>

                {/* Shared Concepts & Footer Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">Shared:</span>
                    {conn.shared_entities?.map((e, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] text-[var(--text-secondary)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] font-medium"
                      >
                        {e.name}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/assistant?q=${encodeURIComponent(`Explain the cross-disciplinary connection between '${conn.source_document?.title}' and '${conn.target_document?.title}'`)}`}
                    className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Investigate in Assistant</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
