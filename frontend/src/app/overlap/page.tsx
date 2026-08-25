'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOverlap, getDashboardStats, InsightData, DashboardStats } from '@/lib/api';
import {
  Layers,
  Info,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

export default function OverlapPage() {
  const [overlaps, setOverlaps] = useState<InsightData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [minScore, setMinScore] = useState(0.4);

  useEffect(() => {
    setLoading(true);
    Promise.all([getOverlap(minScore), getDashboardStats()])
      .then(([overlapData, statsData]) => {
        setOverlaps(overlapData);
        setStats(statsData);
      })
      .catch((e) => setError(e.message || 'Failed to load overlap data'))
      .finally(() => setLoading(false));
  }, [minScore]);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Redundancy Detection & Synergy Analysis</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Potential Research Overlap
          </h1>
          <p className="text-xs lg:text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed max-w-2xl">
            Identify potential thematic, algorithmic, or dataset redundancies across faculties to uncover co-authorship and resource sharing opportunities.
          </p>
        </div>

        {/* Threshold filter */}
        <div className="flex items-center gap-3 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border-subtle)]">
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-[var(--text-muted)] font-semibold">Threshold:</span>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="ui-input py-1.5 px-3 text-xs w-44 bg-[var(--bg-surface-elevated)] border-0"
          >
            <option value={0.3}>30% + (Weak Signals)</option>
            <option value={0.4}>40% + (Moderate Overlap)</option>
            <option value={0.6}>60% + (Significant Overlap)</option>
            <option value={0.8}>80% + (High Redundancy)</option>
          </select>
        </div>
      </div>

      {/* Academic Advisory Notice */}
      <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5 text-xs text-[var(--text-secondary)] leading-relaxed shadow-sm">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[var(--text-primary)]">Academic Advisory:</span> High similarity scores indicate potential methodological or dataset convergence across departments. They are surfaced to encourage interdisciplinary collaboration before publication.
        </div>
      </div>

      {/* Overlap Cards or Rich Informative Empty State */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-[var(--bg-surface-elevated)] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="panel p-10 text-center">
          <p className="text-sm font-semibold text-[var(--danger)] mb-2">Error loading overlap data</p>
          <p className="text-xs text-[var(--text-muted)]">{error}</p>
        </div>
      ) : overlaps.length === 0 ? (
        /* Rich Informative Empty State */
        <div className="panel p-10 md:p-14 text-center space-y-8 max-w-3xl mx-auto border-indigo-500/20">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-black text-[var(--text-primary)]">
              No High-Confidence Overlap Detected
            </h2>
            <p className="text-xs lg:text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg mx-auto">
              Your current research corpus contains no document pairs exceeding the selected {Math.round(minScore * 100)}% similarity threshold.
            </p>
          </div>

          {/* Corpus stats strip */}
          {stats && (
            <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto py-6 border-y border-[var(--border-subtle)] text-xs">
              <div className="p-3 rounded-lg bg-[var(--bg-surface-elevated)]">
                <span className="font-black text-[var(--text-primary)] block font-mono text-base text-indigo-400">
                  {stats.total_documents}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-medium">Indexed papers</span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-surface-elevated)]">
                <span className="font-black text-[var(--text-primary)] block font-mono text-base text-amber-400">
                  {Math.round(minScore * 100)}%
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-medium">Active filter</span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-surface-elevated)]">
                <span className="font-black text-[var(--text-primary)] block font-mono text-base text-emerald-400">
                  {stats.total_insights}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-medium">Total connections</span>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-center gap-4">
            <button
              onClick={() => setMinScore(0.3)}
              className="btn-primary text-xs py-2.5 px-5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Weaker Similarities (30%)</span>
            </button>
            <Link href="/assistant" className="btn-secondary text-xs py-2.5 px-5">
              <span>Ask Anveshan AI</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {overlaps.map((item) => {
            const scorePct = Math.round(item.similarity_score * 100);
            const isHigh = scorePct >= 75;

            return (
              <article key={item.id} className="panel panel-hover p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wide uppercase ${
                      isHigh
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {item.overlap_label}
                    </span>
                    <span className="text-[var(--text-muted)] font-semibold capitalize">
                      {item.connection_type?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span className="font-mono font-black text-sm text-emerald-400">
                    {scorePct}% overlap
                  </span>
                </div>

                {/* Side by side papers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1">
                  <div className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      {item.source_document?.department || 'Department A'}
                    </span>
                    <h3 className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                      {item.source_document?.title}
                    </h3>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      {item.target_document?.department || 'Department B'}
                    </span>
                    <h3 className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                      {item.target_document?.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {item.explanation}
                </p>

                {item.shared_entities?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                    <span className="text-[11px] text-[var(--text-muted)] font-bold">Shared Elements:</span>
                    {item.shared_entities.map((e, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] text-[11px] font-medium border border-[var(--border-subtle)]"
                      >
                        {e.name}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
