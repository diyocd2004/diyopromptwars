'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from '@/context/ThemeContext';
import { getDashboardStats, getGraphData, DashboardStats } from '@/lib/api';
import {
  Network,
  UploadCloud,
  ArrowUpRight,
  GitBranch,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Database,
  Cpu,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';

const ENTITY_COLORS: Record<string, string> = {
  Paper: '#818cf8',
  Algorithm: '#f87171',
  Dataset: '#34d399',
  Methodology: '#f472b6',
  Research_Topic: '#38bdf8',
  Domain: '#c084fc',
  Department: '#d8b4fe',
  Technology: '#fb923c',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [miniNodes, setMiniNodes] = useState<Node[]>([]);
  const [miniEdges, setMiniEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setLoading(true);
    Promise.all([getDashboardStats(), getGraphData({ limit: 50 })])
      .then(([statsData, graphData]) => {
        setStats(statsData);

        // Build a beautifully positioned subgraph preview
        const nodes: Node[] = graphData.nodes.slice(0, 32).map((n, i) => {
          const angle = (2 * Math.PI * i) / Math.min(graphData.nodes.length, 32);
          const r = 160 + (i % 3) * 75;
          const color = ENTITY_COLORS[n.type] || '#818cf8';

          return {
            id: n.id,
            position: { x: 420 + r * Math.cos(angle), y: 240 + r * Math.sin(angle) },
            data: {
              label: (
                <div className="flex items-center gap-1.5 px-1 py-0.5 pointer-events-none">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="truncate max-w-[130px] text-[11px] font-bold tracking-tight">
                    {n.label}
                  </span>
                </div>
              ),
            },
            style: {
              background: resolvedTheme === 'dark' ? '#0f1426' : '#ffffff',
              color: resolvedTheme === 'dark' ? '#f8fafc' : '#0f172a',
              border: `1.5px solid ${color}`,
              borderRadius: '8px',
              padding: '4px 8px',
              fontSize: '11px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
            },
          };
        });

        const edges: Edge[] = graphData.edges.slice(0, 45).map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'smoothstep',
          style: { stroke: resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.25)' : 'rgba(100, 116, 139, 0.3)', strokeWidth: 1.5 },
        }));

        setMiniNodes(nodes);
        setMiniEdges(edges);
      })
      .catch((e) => setError(e.message || 'Unable to connect to Anveshan API'))
      .finally(() => setLoading(false));
  }, [resolvedTheme]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <p className="text-sm font-bold text-[var(--danger)] mb-1">Backend Connection Offline</p>
        <p className="text-xs text-[var(--text-muted)] mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary text-xs">
          Retry Connection
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-10 pb-16">
      {/* 1. Hero Welcome Banner */}
      <section className="panel p-8 lg:p-10 relative overflow-hidden bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950/40 border-1.5 border-indigo-500/30 shadow-xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ACADEMIC KNOWLEDGE GRAPH & SYNTHESIS ENGINE</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Anveshan Research AI
            </h1>
            <p className="text-xs lg:text-sm text-slate-300 leading-relaxed max-w-2xl">
              An intelligent academic research discovery engine that bridges university research silos, uncovers hidden algorithm and dataset overlaps, and generates grounded cross-disciplinary synthesis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/graph" className="btn-primary text-xs py-2.5 px-4 shadow-lg">
              <Network className="w-4 h-4" />
              <span>Explore Knowledge Graph</span>
            </Link>
            <Link href="/ingestion" className="btn-secondary text-xs py-2.5 px-4">
              <UploadCloud className="w-4 h-4" />
              <span>Ingest Source</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Structured Analytical Metric Cards Grid */}
      <section aria-label="Key Corpus Metrics" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="panel p-5 space-y-1.5 border-1.5 border-indigo-500/25 hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between text-xs text-indigo-400 font-bold mb-1">
            <span>INDEXED PAPERS</span>
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-3xl font-black text-white block tracking-tight">
            {stats.total_documents}
          </span>
          <p className="text-[11px] text-[var(--text-muted)] font-medium">Papers, theses & repos</p>
        </div>

        <div className="panel p-5 space-y-1.5 border-1.5 border-emerald-500/25 hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-1">
            <span>EXTRACTED ENTITIES</span>
            <Database className="w-4 h-4" />
          </div>
          <span className="text-3xl font-black text-white block tracking-tight">
            {stats.total_entities}
          </span>
          <p className="text-[11px] text-[var(--text-muted)] font-medium">Algorithms, models, datasets</p>
        </div>

        <div className="panel p-5 space-y-1.5 border-1.5 border-purple-500/25 hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between text-xs text-purple-400 font-bold mb-1">
            <span>RELATIONSHIPS</span>
            <GitBranch className="w-4 h-4" />
          </div>
          <span className="text-3xl font-black text-white block tracking-tight">
            {stats.total_relationships}
          </span>
          <p className="text-[11px] text-[var(--text-muted)] font-medium">Multi-layer ontology edges</p>
        </div>

        <div className="panel p-5 space-y-1.5 border-1.5 border-cyan-500/25 hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-bold mb-1">
            <span>FACULTIES</span>
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-3xl font-black text-white block tracking-tight">
            {stats.total_departments}
          </span>
          <p className="text-[11px] text-[var(--text-muted)] font-medium">Cross-department coverage</p>
        </div>

        <div className="panel p-5 space-y-1.5 border-1.5 border-rose-500/25 hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between text-xs text-rose-400 font-bold mb-1">
            <span>DISCOVERED BRIDGES</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-3xl font-black text-white block tracking-tight">
            {stats.total_insights}
          </span>
          <p className="text-[11px] text-[var(--text-muted)] font-medium">Surfaced connections</p>
        </div>
      </section>

      {/* 3. Large Live Knowledge Graph Preview Canvas */}
      <section aria-label="Live Knowledge Graph Preview" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Network className="w-5 h-5 text-[var(--accent)]" />
              <span>Live Knowledge Graph Preview</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Interactive subgraph sample — pan, zoom, or open the full 95-node ontology
            </p>
          </div>
          <Link href="/graph" className="btn-secondary text-xs py-1.5 px-3">
            <span>Open Full Graph (95 Nodes)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div
          className="w-full relative rounded-2xl overflow-hidden border-1.5 border-[var(--border-subtle)] bg-[var(--graph-canvas-bg)] shadow-xl"
          style={{ height: '440px' }}
        >
          <ReactFlowProvider>
            <ReactFlow
              nodes={miniNodes}
              edges={miniEdges}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              zoomOnScroll={false}
              panOnScroll={false}
              nodesDraggable={false}
              style={{ width: '100%', height: '100%' }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1}
                color={resolvedTheme === 'dark' ? '#1e243a' : '#cbd5e1'}
              />
            </ReactFlow>
          </ReactFlowProvider>

          {/* Floating Action Overlay */}
          <div className="absolute bottom-4 right-4 z-10">
            <Link href="/graph" className="btn-primary text-xs py-2 px-4 shadow-xl">
              <span>Explore Interactive Graph Mode →</span>
            </Link>
          </div>

          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] font-bold shadow-sm">
            <span>Sample Subgraph (32 Entities • 45 Links)</span>
          </div>
        </div>
      </section>

      {/* 4. Two Column Layout: Cross-Disciplinary Discoveries & Overlap Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cross-Disciplinary Discoveries (7 cols) */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[var(--accent)]" />
              <span>Cross-Disciplinary Synergies</span>
            </h2>
            <Link href="/connections" className="text-xs text-[var(--accent)] hover:underline font-bold">
              View All ({stats.total_insights}) →
            </Link>
          </div>

          <div className="space-y-3">
            <article className="panel p-5 space-y-2.5 border-1.5 border-[var(--border-subtle)] hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--text-primary)] text-sm">
                  Cybersecurity ⟷ Statistics
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25">
                  89% Match
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                Shared application of Random Forest and time-series anomaly detection algorithms bridging network traffic monitoring with high-dimensional statistical anomaly models.
              </p>
              <div className="pt-1">
                <Link href="/connections" className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1">
                  <span>View synergy breakdown</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </article>

            <article className="panel p-5 space-y-2.5 border-1.5 border-[var(--border-subtle)] hover:border-purple-500/50 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--text-primary)] text-sm">
                  Data Science ⟷ Biotechnology
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25">
                  84% Match
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                Transfer learning and federated LSTM networks utilized for privacy-preserving clinical records and multi-omics genomic biomarker discovery.
              </p>
              <div className="pt-1">
                <Link href="/connections" className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1">
                  <span>View synergy breakdown</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </article>

            <article className="panel p-5 space-y-2.5 border-1.5 border-[var(--border-subtle)] hover:border-cyan-500/50 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--text-primary)] text-sm">
                  Electronics ⟷ Computer Science
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25">
                  78% Match
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                Genetic optimization and IoT sensor streams applied to autonomous robotics navigation and edge-computed predictive maintenance.
              </p>
              <div className="pt-1">
                <Link href="/connections" className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1">
                  <span>View synergy breakdown</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* Potential Overlap Signals & Assistant CTA (5 cols) */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Potential Research Overlap</span>
            </h2>
            <Link href="/overlap" className="text-xs text-[var(--accent)] hover:underline font-bold">
              Analyze Overlap →
            </Link>
          </div>

          <div className="space-y-4">
            <div className="panel p-5 space-y-2.5 border-1.5 border-[var(--border-subtle)]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400 text-sm">Thematic & Dataset Proximity</span>
                <span className="text-[11px] font-mono text-[var(--text-muted)] font-bold">3 Candidates</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                Automated similarity detection identifies opportunities for co-authorship and resource sharing before studies are published.
              </p>
              <div className="pt-2">
                <Link href="/overlap" className="text-xs text-indigo-400 hover:underline font-bold inline-flex items-center gap-1">
                  <span>Review similarity radar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Research Assistant Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/50 to-purple-950/40 border-1.5 border-indigo-500/35 space-y-3 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-300">
                <Sparkles className="w-4 h-4" />
                <span>Ask Anveshan Research Assistant</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Query research concepts across all departments with grounded citations and multi-hop graph retrieval.
              </p>
              <Link href="/assistant" className="btn-primary text-xs py-2 px-4 inline-block">
                Start Research Query →
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Ingestion Pipeline Activity Table */}
      <section className="panel p-6 md:p-8 space-y-4 border-1.5 border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>Recent Ingestion & Pipeline Activity</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Status of documents and public links processed into the knowledge graph
            </p>
          </div>
          <Link href="/ingestion" className="btn-secondary text-xs py-1.5 px-3">
            <span>+ Ingest Source</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase text-[10px] font-bold">
                <th className="pb-3 font-semibold">Document ID</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Stage</th>
                <th className="pb-3 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {stats.recent_ingestions.map((job) => (
                <tr key={job.id} className="hover:bg-[var(--bg-surface-elevated)]/60 transition-colors">
                  <td className="py-3 font-mono text-[var(--text-secondary)] font-medium">
                    {job.document_id.slice(0, 16)}...
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 text-[var(--text-primary)] font-medium capitalize">
                    {job.stage === 'done' ? 'Knowledge Graph Synced' : job.stage}
                  </td>
                  <td className="py-3 text-right text-[var(--text-muted)] font-mono">
                    {job.created_at ? new Date(job.created_at).toLocaleTimeString() : 'Active'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-44 bg-[var(--bg-surface-elevated)] rounded-2xl border border-[var(--border-subtle)]" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)]" />
        ))}
      </div>
      <div className="h-96 bg-[var(--bg-surface-elevated)] rounded-2xl border border-[var(--border-subtle)]" />
    </div>
  );
}
