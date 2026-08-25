'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { getGraphData, getEntityDetails, GraphNode, GraphEdge, EntityDetail } from '@/lib/api';
import {
  Search,
  RefreshCw,
  X,
  Sparkles,
  FileText,
  GitBranch,
  Layers,
  Network,
  Maximize2,
} from 'lucide-react';

const ENTITY_CONFIG: Record<string, { bg: string; border: string; text: string; dot: string; size: number }> = {
  Paper: { bg: '#1e1b4b', border: '#6366f1', text: '#e0e7ff', dot: '#818cf8', size: 14 },
  Thesis: { bg: '#1e1b4b', border: '#4f46e5', text: '#e0e7ff', dot: '#6366f1', size: 14 },
  Author: { bg: '#451a03', border: '#d97706', text: '#fef3c7', dot: '#fbbf24', size: 10 },
  Researcher: { bg: '#451a03', border: '#d97706', text: '#fef3c7', dot: '#f59e0b', size: 10 },
  Dataset: { bg: '#064e3b', border: '#10b981', text: '#d1fae5', dot: '#34d399', size: 12 },
  Algorithm: { bg: '#450a0a', border: '#ef4444', text: '#fee2e2', dot: '#f87171', size: 13 },
  Model: { bg: '#4c0519', border: '#f43f5e', text: '#ffe4e6', dot: '#fb7185', size: 12 },
  Methodology: { bg: '#500724', border: '#ec4899', text: '#fce7f3', dot: '#f472b6', size: 12 },
  Research_Topic: { bg: '#083344', border: '#06b6d4', text: '#e0f2fe', dot: '#38bdf8', size: 13 },
  Domain: { bg: '#3b0764', border: '#a855f7', text: '#f3e8ff', dot: '#c084fc', size: 14 },
  Department: { bg: '#3b0764', border: '#9333ea', text: '#fae8ff', dot: '#d8b4fe', size: 15 },
  Technology: { bg: '#431407', border: '#ea580c', text: '#ffedd5', dot: '#fb923c', size: 11 },
  Framework: { bg: '#431407', border: '#ea580c', text: '#ffedd5', dot: '#f97316', size: 11 },
  Programming_Language: { bg: '#042f2e', border: '#14b8a6', text: '#ccfbf1', dot: '#2dd4bf', size: 10 },
};

const CATEGORIES = ['All', 'Paper', 'Dataset', 'Algorithm', 'Methodology', 'Research_Topic', 'Domain', 'Technology', 'Department'];

export default function KnowledgeGraphPage() {
  return (
    <ReactFlowProvider>
      <GraphCanvas />
    </ReactFlowProvider>
  );
}

function GraphCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rawGraph, setRawGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<EntityDetail | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const reactFlow = useReactFlow();

  // Load and position all 95 nodes and 255 edges
  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (selectedCategory !== 'All') {
        params.entity_types = selectedCategory;
      }
      const data = await getGraphData(params);
      setRawGraph(data);

      // Group nodes by type for force-cluster layout
      const groups: Record<string, GraphNode[]> = {};
      data.nodes.forEach((n) => {
        const type = n.type || 'Other';
        if (!groups[type]) groups[type] = [];
        groups[type].push(n);
      });

      const groupKeys = Object.keys(groups);
      const groupCount = groupKeys.length;
      const rfNodes: Node[] = [];

      groupKeys.forEach((groupKey, gIdx) => {
        const angle = (2 * Math.PI * gIdx) / Math.max(groupCount, 1);
        const radius = 460;
        const centerX = 650 + radius * Math.cos(angle);
        const centerY = 500 + radius * Math.sin(angle);

        const groupNodes = groups[groupKey];
        groupNodes.forEach((n, nIdx) => {
          const innerAngle = (2 * Math.PI * nIdx) / Math.max(groupNodes.length, 1);
          const innerRadius = 80 + (nIdx % 4) * 45;
          const x = centerX + innerRadius * Math.cos(innerAngle);
          const y = centerY + innerRadius * Math.sin(innerAngle);

          const conf = ENTITY_CONFIG[n.type] || {
            bg: '#141930',
            border: '#64748b',
            text: '#f8fafc',
            dot: '#94a3b8',
            size: 11,
          };

          rfNodes.push({
            id: n.id,
            position: { x, y },
            data: {
              label: (
                <div className="flex items-center gap-1.5 px-1 py-0.5 pointer-events-none select-none">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: conf.dot }}
                  />
                  <span className="truncate max-w-[130px] text-[11px] font-medium tracking-tight">
                    {n.label}
                  </span>
                </div>
              ),
              fullLabel: n.label,
              entityType: n.type,
              department: n.department,
            },
            style: {
              backgroundColor: conf.bg,
              color: conf.text,
              border: `1px solid ${conf.border}`,
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              transition: 'all 0.15s ease',
            },
          });
        });
      });

      const rfEdges: Edge[] = data.edges.map((e: GraphEdge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        animated: e.confidence >= 0.85,
        style: {
          stroke: resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.18)' : 'rgba(100, 116, 139, 0.25)',
          strokeWidth: Math.max(1, e.confidence * 1.5),
        },
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
    } catch (e: any) {
      setError(e.message || 'Failed to load graph data');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, resolvedTheme, setNodes, setEdges]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Node click -> open detail drawer with real API data
  const handleNodeClick = useCallback(async (_: any, node: Node) => {
    try {
      const details = await getEntityDetails(node.id);
      setSelectedEntity(details);
    } catch (e) {
      console.error('Failed to load entity details:', e);
    }
  }, []);

  // Hover highlighting neighborhood
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return null;
    const ids = new Set<string>([hoveredNodeId]);
    rawGraph.edges.forEach((e) => {
      if (e.source === hoveredNodeId) ids.add(e.target);
      if (e.target === hoveredNodeId) ids.add(e.source);
    });
    return ids;
  }, [hoveredNodeId, rawGraph.edges]);

  const displayNodes = useMemo(() => {
    if (!connectedNodeIds && !searchTerm.trim()) return nodes;

    const term = searchTerm.trim().toLowerCase();

    return nodes.map((n) => {
      const isSearchMatch = term
        ? n.data.fullLabel?.toLowerCase().includes(term) ||
          n.data.entityType?.toLowerCase().includes(term)
        : true;

      const isHoverMatch = connectedNodeIds ? connectedNodeIds.has(n.id) : true;
      const isFocused = isSearchMatch && isHoverMatch;

      return {
        ...n,
        style: {
          ...n.style,
          opacity: isFocused ? 1 : 0.1,
          transform: isFocused && (hoveredNodeId === n.id || (term && isSearchMatch)) ? 'scale(1.15)' : 'scale(1)',
          zIndex: isFocused ? 20 : 1,
        },
      };
    });
  }, [nodes, connectedNodeIds, searchTerm, hoveredNodeId]);

  const displayEdges = useMemo(() => {
    if (!hoveredNodeId) return edges;

    return edges.map((e) => {
      const isConnected = e.source === hoveredNodeId || e.target === hoveredNodeId;
      return {
        ...e,
        style: {
          ...e.style,
          stroke: isConnected ? '#818cf8' : 'rgba(148, 163, 184, 0.05)',
          strokeWidth: isConnected ? 2.5 : 1,
          zIndex: isConnected ? 10 : 1,
        },
      };
    });
  }, [edges, hoveredNodeId]);

  // Search node focus
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const match = nodes.find(
      (n) =>
        n.data.fullLabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.data.entityType?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (match) {
      reactFlow.setCenter(match.position.x, match.position.y, { zoom: 1.3, duration: 800 });
      handleNodeClick(null, match);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-[var(--accent)] uppercase mb-1">
            KNOWLEDGE GRAPH
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            University Research Ontology
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Preserves 95 academic nodes and 255 multi-disciplinary relationships across all faculties
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Locate entity in graph..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ui-input pl-8.5 pr-7 py-1.5 text-xs w-52 bg-[var(--bg-surface)]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
              >
                ✕
              </button>
            )}
          </form>

          <button
            onClick={() => { reactFlow.fitView({ padding: 0.25, duration: 600 }); }}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fit View</span>
          </button>

          <button
            onClick={fetchGraph}
            className="btn-secondary text-xs py-1.5 px-2.5"
            title="Refresh Knowledge Graph"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-[var(--text-muted)] mr-1 shrink-0">Filter:</span>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const conf = ENTITY_CONFIG[cat];
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              {conf && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: conf.dot }}
                />
              )}
              <span>{cat.replace(/_/g, ' ')}</span>
            </button>
          );
        })}
      </div>

      {/* Full-Height Responsive Canvas Container */}
      <div
        className="w-full relative rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--graph-canvas-bg)]"
        style={{ height: 'calc(100vh - 220px)', minHeight: '620px' }}
      >
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[var(--bg-app)]/60">
            <div className="w-6 h-6 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
            <p className="text-xs text-[var(--text-muted)]">Loading full ontology graph...</p>
          </div>
        ) : error ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm font-bold text-[var(--danger)] mb-2">Graph Connection Error</p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mb-4">{error}</p>
            <button onClick={fetchGraph} className="btn-primary text-xs">Retry</button>
          </div>
        ) : (
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onNodeMouseEnter={(_, n) => setHoveredNodeId(n.id)}
            onNodeMouseLeave={() => setHoveredNodeId(null)}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            minZoom={0.05}
            maxZoom={3.5}
            panOnScroll={true}
            zoomOnPinch={true}
            zoomOnScroll={true}
            preventScrolling={false}
            nodesDraggable={true}
            style={{ width: '100%', height: '100%' }}
          >
            <Controls position="bottom-right" showInteractive={false} />
            <MiniMap
              position="bottom-left"
              style={{
                background: resolvedTheme === 'dark' ? '#0d1120' : '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
              }}
              nodeColor={(n) => ENTITY_CONFIG[n.data?.entityType as string]?.dot || '#64748b'}
              maskColor={resolvedTheme === 'dark' ? 'rgba(6, 8, 16, 0.85)' : 'rgba(241, 245, 249, 0.85)'}
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color={resolvedTheme === 'dark' ? '#1e243a' : '#cbd5e1'}
            />
          </ReactFlow>
        )}

        {/* Floating Minimal Legend */}
        <div className="absolute top-3 left-3 z-10 px-3 py-2 rounded-lg bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border-subtle)] text-[11px] flex flex-wrap items-center gap-3 shadow-xs">
          {['Paper', 'Algorithm', 'Dataset', 'Methodology', 'Research_Topic', 'Department'].map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ENTITY_CONFIG[type]?.dot }}
              />
              <span className="text-[var(--text-secondary)] font-medium">{type.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>

        {/* Slide-out Entity Details Drawer with Real API Data */}
        {selectedEntity && (
          <aside
            className="absolute right-0 top-0 bottom-0 w-84 bg-[var(--bg-surface)]/98 backdrop-blur-2xl border-l border-[var(--border-subtle)] p-6 overflow-y-auto z-20 flex flex-col justify-between shadow-2xl"
            role="dialog"
            aria-label="Entity Details"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <span
                  className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: ENTITY_CONFIG[selectedEntity.type]?.border || '#64748b' }}
                >
                  {selectedEntity.type?.replace(/_/g, ' ')}
                </span>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-surface-elevated)]"
                  aria-label="Close details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-base font-bold text-[var(--text-primary)] mt-3 mb-1 leading-snug">
                {selectedEntity.name}
              </h2>

              {/* Referenced Papers */}
              <div className="mt-5">
                <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Referenced Papers ({selectedEntity.documents?.length || 0})</span>
                </h3>
                <div className="space-y-2">
                  {selectedEntity.documents?.map((doc) => (
                    <div key={doc.id} className="p-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                      <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">{doc.title}</p>
                      <span className="text-[10px] text-[var(--accent)] font-medium mt-1 block">
                        {doc.department || 'General Faculty'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graph Connections */}
              <div className="mt-5">
                <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Graph Links ({selectedEntity.relationships?.length || 0})</span>
                </h3>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedEntity.relationships?.map((rel, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[11px]">
                      <div className="flex items-center justify-between text-[var(--text-muted)] mb-1">
                        <span className="font-bold text-[var(--accent)] uppercase text-[10px]">{rel.type.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-[10px]">{Math.round(rel.confidence * 100)}%</span>
                      </div>
                      <p className="text-[var(--text-secondary)] truncate">
                        {rel.source === selectedEntity.name ? `→ ${rel.target}` : `← ${rel.source}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="pt-4 border-t border-[var(--border-subtle)] mt-6">
              <Link
                href={`/assistant?q=${encodeURIComponent(`Explain research related to '${selectedEntity.name}' and its cross-disciplinary connections`)}`}
                className="btn-primary w-full justify-center text-xs py-2.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Investigate in Assistant</span>
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
