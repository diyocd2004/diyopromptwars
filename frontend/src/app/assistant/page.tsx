'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { queryAssistant, AssistantResponse } from '@/lib/api';
import {
  Sparkles,
  ArrowUpRight,
  FileText,
  GitBranch,
  Bot,
  User,
  RotateCcw,
  Compass,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: AssistantResponse;
  timestamp: Date;
}

const SUGGESTED_QUERIES = [
  'Find research related to insider threat detection across departments',
  'Which cybersecurity and statistics studies share anomaly detection methods?',
  'Show datasets used across both Biotechnology and Computer Science',
  'What algorithms are shared between Healthcare Analytics and Electronics?',
];

export default function AssistantPage() {
  return (
    <Suspense fallback={<AssistantSkeleton />}>
      <AssistantInner />
    </Suspense>
  );
}

function AssistantInner() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && messages.length === 0) {
      handleSubmit(q);
    }
  }, [searchParams]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: q,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await queryAssistant(q);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer?.answer || 'No synthesis response available.',
        data: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error generating research response: ${err.message}. Please verify the backend connection.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col justify-between" style={{ minHeight: 'calc(100vh - 160px)' }}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-6">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-[var(--accent)] uppercase mb-1">
            RESEARCH INTELLIGENCE
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Anveshan Research Assistant
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Query across university papers, explore methodology links, and receive grounded citations
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="btn-ghost text-xs py-1.5 px-3"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Messages Scroll View */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 mb-6 pr-1">
        {messages.length === 0 ? (
          /* Centered Initial View */
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface-elevated)] border-2 border-[var(--border-medium)] flex items-center justify-center text-[var(--accent)] mb-4 shadow-lg shadow-indigo-500/15">
              <Compass className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-1">
              Ask Anything Across the University Knowledge Graph
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mb-8 leading-relaxed">
              Synthesizes research by traversing 768-dimensional embeddings and entity relationships across all faculties.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full max-w-2xl text-left">
              {SUGGESTED_QUERIES.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(sq)}
                  className="pop-card p-4 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-start justify-between gap-3 group"
                >
                  <span className="leading-relaxed font-medium">{sq}</span>
                  <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-indigo-400 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border-1.5 border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <Bot className="w-4.5 h-4.5" />
                </div>
              )}

              <div
                className={`rounded-xl p-5 max-w-[88%] text-xs leading-relaxed border-1.5 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold border-indigo-400 shadow-md'
                    : 'panel bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-subtle)]'
                }`}
              >
                {/* Message Text Content */}
                <div className="whitespace-pre-wrap leading-relaxed text-xs">
                  {msg.content}
                </div>

                {/* Structured Assistant Citations & Discoveries */}
                {msg.data && msg.data.answer && (
                  <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] space-y-4">
                    {/* Cited Papers */}
                    {msg.data.answer.cited_documents?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Grounded Sources & Citations</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.data.answer.cited_documents.map((doc, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-elevated)] border-1.5 border-[var(--border-subtle)] text-[var(--text-secondary)] text-[11px] font-semibold hover:border-indigo-500/40 transition-colors"
                            >
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Discovered Connections */}
                    {msg.data.answer.discovered_connections?.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Cross-Disciplinary Links</span>
                        </div>
                        <div className="space-y-2">
                          {msg.data.answer.discovered_connections.map((conn, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-[var(--bg-surface-elevated)] border-1.5 border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] hover:border-indigo-500/40 transition-colors"
                            >
                              {conn.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer metadata */}
                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-mono pt-1">
                      <span>Query intent: {msg.data.query_type}</span>
                      <span>•</span>
                      <span>Confidence: {Math.round((msg.data.answer.confidence || 0.85) * 100)}%</span>
                      <span>•</span>
                      <span>{msg.data.entities_found} entities matched</span>
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-[var(--bg-surface-elevated)] border-1.5 border-[var(--border-medium)] text-[var(--text-muted)] flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <User className="w-4.5 h-4.5" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3.5 justify-start">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border-1.5 border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className="panel p-4 rounded-xl flex items-center gap-3 border-1.5 border-indigo-500/30">
              <div className="w-4 h-4 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
              <span className="text-xs text-[var(--text-secondary)] font-medium">Traversing knowledge graph and synthesizing answer...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box with Defined Border */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        className="panel p-2 flex items-center gap-2 relative bg-[var(--bg-surface)] sticky bottom-0 border-1.5 border-[var(--border-medium)] shadow-xl"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about cross-department research, methods, datasets, or papers..."
          className="ui-input flex-1 border-0 bg-transparent text-xs py-2 focus:ring-0 focus:border-0"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary text-xs py-2 px-4 disabled:opacity-40"
        >
          <span>Ask</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

function AssistantSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-6 w-48 bg-[var(--bg-surface-elevated)] rounded-xl" />
      <div className="h-4 w-96 bg-[var(--bg-surface-elevated)] rounded-xl" />
      <div className="h-64 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]" />
    </div>
  );
}
