'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard,
  Search,
  Network,
  Sparkles,
  GitBranch,
  Layers,
  UploadCloud,
  Sun,
  Moon,
  Compass,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explorer', label: 'Explorer', icon: Search },
  { href: '/graph', label: 'Graph', icon: Network },
  { href: '/assistant', label: 'Assistant', icon: Sparkles },
  { href: '/connections', label: 'Connections', icon: GitBranch },
  { href: '/overlap', label: 'Overlap', icon: Layers },
  { href: '/ingestion', label: 'Ingest', icon: UploadCloud },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  // Close mobile menu on page change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-header-search');
        if (searchInput) {
          searchInput.focus();
        } else {
          router.push('/explorer');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explorer?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] app-backdrop flex flex-col">
      {/* 1. Sticky Top Navigation Bar with Clear Spacing & Defined Borders */}
      <header className="sticky top-0 z-50 h-16 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-header)] backdrop-blur-xl transition-colors shadow-sm">
        <div className="max-w-[1440px] w-[calc(100%-48px)] mx-auto h-full flex items-center justify-between gap-6">
          {/* Left: Brand Logo & Title with Defined Border */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface)] hover:border-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)] tracking-tight">
                  Anveshan AI
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 hidden sm:inline-block">
                  PRO
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Buttons with Clean Spacing & Hover Shine */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-btn px-3.5 py-1.5 h-9 justify-center text-center shrink-0 ${isActive ? 'nav-btn-active' : ''}`}
                >
                  <item.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-[var(--text-muted)]'}`} />
                  <span className="text-xs font-bold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Spacious, Clear Global Search & Theme Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Global Search Bar */}
            <form onSubmit={handleGlobalSearch} className="relative hidden md:block w-56 lg:w-72">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="global-header-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search research, methods... (⌘K)"
                className="ui-input pl-9 pr-8 py-1.5 text-xs bg-[var(--bg-surface)] border-[var(--border-subtle)] focus:border-indigo-400 shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-indigo-400 hover:shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-all"
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[var(--border-subtle)] bg-[var(--bg-header)] backdrop-blur-2xl p-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    isActive
                      ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border-indigo-500/50 shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border-[var(--border-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* 2. Main Centered Content Container */}
      <main className="flex-1 w-full">
        <div className="app-container">
          {children}
        </div>
      </main>
    </div>
  );
}
