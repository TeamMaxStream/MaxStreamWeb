"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MonitorPlay,
  Smartphone,
  Tv,
  Download,
  Shield,
  Zap,
  RefreshCw,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Code2,
  ExternalLink,
  Play,
  Globe,
  Sparkles,
  ArrowRight,
  Activity,
  Star,
  GitFork,
  Tag,
  HardDriveDownload,
  Film,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import type { RepoStats } from "@/lib/github";
import { useRepoStats, formatCount } from "@/lib/use-repo-stats";

const GITHUB_REPO = "https://github.com/TeamMaxStream/MaxStream";
const RELEASES_URL = `${GITHUB_REPO}/releases`;
const LATEST_RELEASE = `${RELEASES_URL}/latest/download`;
const MOBILE_APK_ARM64 = `${LATEST_RELEASE}/maxstream-arm64-v8a.apk`;
const MOBILE_APK_ARM32 = `${LATEST_RELEASE}/maxstream-armeabi-v7a.apk`;
const MOBILE_APK_X86 = `${LATEST_RELEASE}/maxstream-x86_64.apk`;
const TV_APK = `${LATEST_RELEASE}/maxstream-tv.apk`;
const WINDOWS_MSI = `${LATEST_RELEASE}/MaxStream-Desktop.msi`;
const WINDOWS_EXE = `${LATEST_RELEASE}/MaxStream-Dex.exe`;

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Screenshots", href: "#screenshots" },
  { label: "Download", href: "#download" },
  { label: "FAQ", href: "#faq" },
];

// One observer for every reveal element instead of one per card, plus a
// safety net: anything not revealed within a few seconds, or stuck below an
// already-failed viewport, is shown regardless. An element stuck at
// `opacity: 0` used to stay invisible until a reload re-ran the observers.
let revealObserver: IntersectionObserver | null = null;
const revealTimers = new WeakMap<Element, number>();

function revealNow(el: Element) {
  const timer = revealTimers.get(el);
  if (timer !== undefined) window.clearTimeout(timer);
  revealTimers.delete(el);
  el.classList.add("visible");
  revealObserver?.unobserve(el);
}

function revealLater(el: Element, delay: number) {
  if (revealTimers.has(el)) return;
  revealTimers.set(
    el,
    window.setTimeout(() => revealNow(el), delay + 600),
  );
}

let revealScrollBound = false;

// Scroll is an escape hatch from a doomed set of observers: anything below the
// fold that never fires (e.g. a restored scroll position from an earlier
// document) is revealed as soon as the user scrolls or resizes.
function bindRevealFallbacks() {
  if (revealScrollBound) return;
  revealScrollBound = true;
  const sweep = () => {
    for (const el of document.querySelectorAll(".reveal:not(.visible)")) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.2) revealNow(el);
    }
  };
  window.addEventListener("scroll", sweep, { passive: true });
  window.addEventListener("resize", sweep);
  window.addEventListener("pageshow", sweep);
}

function getRevealObserver() {
  if (revealObserver) return revealObserver;
  if (typeof IntersectionObserver === "undefined") {
    document.documentElement.classList.add("no-reveal");
    return null;
  }
  bindRevealFallbacks();
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) revealNow(entry.target);
      }
    },
    { threshold: 0.05, rootMargin: "0px 0px -40px 0px" },
  );
  return revealObserver;
}

function RevealDiv({
  children,
  className = "",
  delay = 0,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = getRevealObserver();
    observer?.observe(el);
    revealLater(el, delay);
    const timer = revealTimers.get(el);
    return () => {
      observer?.unobserve(el);
      if (timer !== undefined) window.clearTimeout(timer);
      revealTimers.delete(el);
    };
  }, [delay]);

  return (
    <div ref={ref} className={`reveal ${className}`} {...props}>
      {children}
    </div>
  );
}

export default function Home({ stats }: { stats: RepoStats }) {
  const live = useRepoStats(stats);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // One download entry point: the hero, navbar, sidebar and download section
  // all open the same dialog instead of jumping straight to one build.
  const [downloadOpen, setDownloadOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col noise-overlay">
      <Navbar
        onMenuToggle={() => setSidebarOpen((o) => !o)}
        onDownload={() => setDownloadOpen(true)}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onDownload={() => {
          setSidebarOpen(false);
          setDownloadOpen(true);
        }}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1">
        <Hero stats={live} onDownload={() => setDownloadOpen(true)} />
        <Features />
        <Screenshots />
        <DownloadSection
          version={live.version}
          open={downloadOpen}
          onOpenChange={setDownloadOpen}
        />
        <FAQ />
      </main>
      <Footer stats={live} />
    </div>
  );
}

function Navbar({
  onMenuToggle,
  onDownload,
}: {
  onMenuToggle: () => void;
  onDownload: () => void;
}) {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/50 bg-background/60 shadow-lg shadow-black/5 backdrop-blur-xl"
          : "border-b border-transparent bg-background/0"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="rounded-xl p-2 hover:bg-border/50 lg:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative">
              <img
                src="/app_icon.png"
                alt="MaxStream"
                className="h-8 w-8 rounded-xl transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 rounded-xl bg-brand/20 blur-md opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              MaxStream
            </span>
          </a>
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-xl px-4 py-2 text-sm text-muted transition-all hover:bg-border/50 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/status"
            className="rounded-xl px-4 py-2 text-sm text-muted transition-all hover:bg-border/50 hover:text-foreground"
          >
            Status
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="rounded-xl p-2 text-muted transition-all hover:bg-border/50 hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onDownload}
            className="hidden rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-dark hover:shadow-lg hover:shadow-brand/30 sm:inline-flex"
          >
            Download
          </button>
        </div>
      </div>
    </nav>
  );
}

function Sidebar({
  open,
  onClose,
  onDownload,
}: {
  open: boolean;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <aside
      aria-hidden={!open}
      className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card/80 backdrop-blur-2xl transition-transform duration-300 ease-out lg:hidden ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <a href="#" className="flex items-center gap-2.5" onClick={onClose}>
          <img
            src="/app_icon.png"
            alt="MaxStream"
            className="h-8 w-8 rounded-xl"
          />
          <span className="text-lg font-bold tracking-tight">MaxStream</span>
        </a>
        <button
          onClick={onClose}
          className="rounded-xl p-2 hover:bg-border/50"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted transition-all hover:bg-border/50 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="mt-8 space-y-1">
          <a
            href="https://github.com/TeamMaxStream/MaxStream"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted transition-all hover:bg-border/50 hover:text-foreground"
          >
            <Code2 className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="https://github.com/TeamMaxStream/MaxStream/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted transition-all hover:bg-border/50 hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            Releases
          </a>
          <a
            href="/status"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted transition-all hover:bg-border/50 hover:text-foreground"
          >
            <Activity className="h-4 w-4" />
            Server Status
          </a>
        </div>
      </nav>

      <div className="border-t border-border p-4 space-y-2">
        <button
          onClick={onDownload}
          className="flex w-full flex-col items-center gap-0.5 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-dark hover:shadow-lg hover:shadow-brand/30"
        >
          <span className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download
          </span>
          <span className="text-[11px] font-normal text-white/80">
            Android · Android TV · Windows
          </span>
        </button>
      </div>
    </aside>
  );
}

function Hero({
  stats,
  onDownload,
}: {
  stats: RepoStats;
  onDownload: () => void;
}) {
  return (
    <section className="relative overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-brand/5 animate-mesh-gradient" />

      {/* Glowing orbs */}
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand/10 blur-[120px] animate-glow-pulse" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-brand/10 blur-[100px] animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-brand/5 blur-[80px] animate-float-slow" />

      {/* Rotating gradient ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-brand/10 animate-rotate-slow opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full border border-brand/10 animate-rotate-slow opacity-20" style={{ animationDirection: "reverse", animationDuration: "30s" }} />

      <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:py-40">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs sm:text-sm animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="text-muted">
            {stats.version ? `v${stats.version}` : "Latest release"} — Shared
            watch history, TV Library & Windows desktop
          </span>
        </div>

        {/* Headline */}
        <h1
          className="mx-auto max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          Stream{" "}
          <span className="gradient-text">
            movies & series
          </span>{" "}
          on any device
        </h1>

        {/* Subtitle */}
        <p
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          Watch on your phone, tablet, Android TV, or Windows PC. Sign in once
          to sync your watchlist, watch history, and progress everywhere.
        </p>

        {/* Single download CTA: the dialog then asks for the device. */}
        <div
          className="mt-10 flex flex-col items-center gap-4 animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          <button
            onClick={onDownload}
            className="group relative flex w-full items-center justify-center gap-2.5 rounded-full bg-brand px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-brand-dark sm:w-auto sm:text-base"
          >
            <div className="absolute inset-0 rounded-full animate-glow-ring opacity-0 transition-opacity group-hover:opacity-100" />
            <Download className="h-5 w-5" />
            Download for Android, Android TV & Windows
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5" /> Android
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Tv className="h-3.5 w-3.5" /> Android TV
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MonitorPlay className="h-3.5 w-3.5" /> Windows
            </span>
            <span className={stats.version ? "" : "hidden"}>
              {stats.version ? `v${stats.version}` : ""}
            </span>
          </div>
        </div>

        <StatsStrip stats={stats} />

        {/* Trust badges */}
        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-12 animate-fade-in-up"
          style={{ animationDelay: "500ms" }}
        >
          {[
            { icon: Globe, label: "Open Source" },
            { icon: Zap, label: "Fast & Lightweight" },
            { icon: Shield, label: "Private & Secure" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 text-sm text-muted">
              <stat.icon className="h-4 w-4 text-brand/70" />
              {stat.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsStrip({ stats }: { stats: RepoStats }) {
  const items = [
    {
      icon: Tag,
      label: "Latest version",
      value: stats.version ? `v${stats.version}` : "—",
      href: stats.version ? `${RELEASES_URL}/tag/v${stats.version}` : RELEASES_URL,
    },
    {
      icon: HardDriveDownload,
      label: "Total downloads",
      value: stats.fetchedAt ? formatCount(stats.downloads) : "—",
      href: `${GITHUB_REPO}/releases`,
    },
    {
      icon: Star,
      label: "GitHub stars",
      value: stats.fetchedAt ? formatCount(stats.stars) : "—",
      href: `${GITHUB_REPO}/stargazers`,
    },
    {
      icon: GitFork,
      label: "Forks",
      value: stats.fetchedAt ? formatCount(stats.forks) : "—",
      href: `${GITHUB_REPO}/forks`,
    },
  ];

  return (
    <div
      className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 animate-fade-in-up sm:grid-cols-4"
      style={{ animationDelay: "400ms" }}
    >
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group glass-card rounded-2xl px-4 py-4 text-center transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-brand/10"
        >
          <item.icon className="mx-auto h-4 w-4 text-brand/70 transition-colors group-hover:text-brand" />
          <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">
            {item.value}
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted sm:text-xs">
            {item.label}
          </p>
        </a>
      ))}
    </div>
  );
}

const FEATURES = [
  {
    icon: MonitorPlay,
    title: "Multi-server streaming",
    desc: "Switch between VixSrc, VidLink, Viduki, and more servers without restarting playback.",
    gradient: "from-red-500/20 to-orange-500/20",
  },
  {
    icon: RefreshCw,
    title: "One library everywhere",
    desc: "Watchlist, watch history, and continue-watching sync in real time across phone, Android TV, and Windows. Deletions and clear-all follow you too.",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: MonitorPlay,
    title: "Native Windows app",
    desc: "A proper desktop player with mpv-powered playback, offline downloads, and the same synced library as mobile and TV.",
    gradient: "from-sky-500/20 to-blue-500/20",
  },
  {
    icon: Tv,
    title: "TV Library & history",
    desc: "Watchlist and watch history live together in a D-pad-friendly Library with reliable focus and one-tap resume.",
    gradient: "from-cyan-500/20 to-teal-500/20",
  },
  {
    icon: Zap,
    title: "Fast & lightweight",
    desc: "Parallel server racing, pre-flight validation, and memory-pressure handling for smooth playback.",
    gradient: "from-yellow-500/20 to-amber-500/20",
  },
  {
    icon: Shield,
    title: "Your account, your data",
    desc: "Sign in with email or device code. Your watchlist, history, and downloads stay private to your profile.",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    icon: Sparkles,
    title: "Voice search",
    desc: "Find movies and series hands-free with built-in voice search and smart query parsing.",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: Play,
    title: "Continue watching",
    desc: "Pick up right where you left off on any device with per-episode progress and automatic next-episode playback.",
    gradient: "from-indigo-500/20 to-violet-500/20",
  },
  {
    icon: Film,
    title: "Swipeable trailers feed",
    desc: "A full-screen, TikTok-style trailer feed built from what you watch. Swipe up for the next one, scrub the progress bar, and tap through to the title.",
    gradient: "from-rose-500/20 to-red-500/20",
  },
];

function Features() {
  return (
    <section id="features" className="relative border-t border-border bg-card/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-brand)_0%,_transparent_70%)] opacity-[0.03]" />
      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <RevealDiv className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Built for{" "}
            <span className="gradient-text-static">watching</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted sm:text-lg">
            Everything you need to stream, nothing you don&apos;t.
          </p>
        </RevealDiv>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:mt-16">
          {FEATURES.map((f, i) => (
            <RevealDiv key={f.title} delay={i * 80}>
              <div className="group glass-card relative overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/10 sm:p-7 h-full">
                {/* Gradient glow on hover */}
                <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br ${f.gradient} blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand/10 to-brand/5 text-brand transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-brand/30">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold sm:text-xl">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {f.desc}
                  </p>
                </div>
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

const SCREENSHOTS = [
  { src: "/screenshots/Home_Screen.jpg", alt: "Home screen" },
  { src: "/screenshots/Login-Signup_Screen.jpg", alt: "Login & Signup" },
  { src: "/screenshots/Search_Screen1.jpg", alt: "Search" },
  { src: "/screenshots/Search_Screen2.jpg", alt: "Search results" },
  { src: "/screenshots/Watchlist_Screen.jpg", alt: "Watchlist" },
  { src: "/screenshots/More_Screen.jpg", alt: "More" },
];

function Screenshots() {
  return (
    <section id="screenshots" className="relative border-t border-border overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand/[0.02] to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <RevealDiv className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            See it in{" "}
            <span className="gradient-text-static">action</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted sm:text-lg">
            A clean, modern interface designed for browsing and watching.
          </p>
        </RevealDiv>

        <div className="mt-14 flex gap-6 overflow-x-auto pb-6 pt-4 snap-x snap-mandatory scrollbar-hide sm:mt-16">
          {SCREENSHOTS.map((s, i) => (
            <RevealDiv
              key={s.src}
              delay={i * 100}
              className="shrink-0 snap-center"
            >
              <div className="group relative">
                {/* Phone frame */}
                <div className="phone-mockup relative w-[200px] sm:w-[240px] lg:w-[280px]">
                  {/* Glow behind phone */}
                  <div className="absolute -inset-4 rounded-[2.5rem] bg-brand/10 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Phone bezel */}
                  <div className="relative rounded-[2rem] border-[3px] border-zinc-800 bg-zinc-900 p-1 shadow-2xl">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 h-5 w-20 rounded-b-2xl bg-zinc-800" />

                    {/* Screen */}
                    <div className="overflow-hidden rounded-[1.5rem]">
                      <img
                        src={s.src}
                        alt={s.alt}
                        className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  </div>
                </div>

                {/* Label */}
                <p className="mt-4 text-center text-sm font-medium text-muted transition-colors group-hover:text-foreground">
                  {s.alt}
                </p>
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

function DownloadSection({
  version,
  open: dialogOpen,
  onOpenChange: setDialogOpen,
}: {
  version: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const closeDialog = useCallback(() => setDialogOpen(false), [setDialogOpen]);

  useEffect(() => {
    if (!dialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDialog();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [dialogOpen, closeDialog]);

  return (
    <section id="download" className="relative border-t border-border overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.06] via-transparent to-brand/[0.04] animate-mesh-gradient" style={{ backgroundSize: "300% 300%" }} />

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 h-40 w-40 rounded-full bg-brand/10 blur-[80px] animate-float" />
      <div className="absolute bottom-20 right-10 h-32 w-32 rounded-full bg-brand/10 blur-[60px] animate-float-reverse" />

      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <RevealDiv className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Download{" "}
            <span className="gradient-text-static">MaxStream</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted sm:text-lg">
            Free for Android phones, Android TV, and Windows. Open-source on
            GitHub.
          </p>
          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-brand"
          >
            <Tag className="h-4 w-4" />
            {version ? `What's new in v${version}` : "Release notes"}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </RevealDiv>

        <RevealDiv delay={200} className="mt-14 flex justify-center sm:mt-16">
          <button
            onClick={() => setDialogOpen(true)}
            className="group relative flex items-center justify-center gap-3 rounded-full bg-brand px-10 py-5 text-base font-semibold text-white transition-all hover:bg-brand-dark hover:shadow-2xl hover:shadow-brand/30 sm:text-lg"
          >
            <div className="absolute inset-0 rounded-full animate-glow-ring" />
            <Download className="h-5 w-5" />
            Download for Android, Android TV & Windows
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </RevealDiv>
      </div>

      {/* Dialog */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in-scale"
          onClick={closeDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-dialog-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border/50 bg-background shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog header with gradient */}
            <div className="relative border-b border-border/50 px-6 py-5">
              <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-brand/5" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h3 id="download-dialog-title" className="text-lg font-bold">
                    Choose your download
                    <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 align-middle text-[10px] font-bold uppercase text-brand">
                      {version ? `v${version}` : "Latest"}
                    </span>
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">Select the build for your device</p>
                </div>
                <button
                  onClick={closeDialog}
                  aria-label="Close"
                  className="rounded-xl p-2 transition-colors hover:bg-border/50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Mobile section */}
              <div>
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <Smartphone className="h-3.5 w-3.5" />
                  Mobile
                </p>
                <div className="space-y-2">
                  {[
                    {
                      href: MOBILE_APK_ARM64,
                      arch: "arm64-v8a",
                      desc: "Samsung S7+, Pixel, OnePlus, Xiaomi, most phones 2017+",
                      recommended: true,
                    },
                    {
                      href: MOBILE_APK_ARM32,
                      arch: "armeabi-v7a",
                      desc: "Older budget phones: Galaxy J2–J7, Moto E/G, LG K series",
                      recommended: false,
                    },
                    {
                      href: MOBILE_APK_X86,
                      arch: "x86_64",
                      desc: "Emulators (AVD, BlueStacks), ChromeOS, Intel devices",
                      recommended: false,
                    },
                  ].map((item) => (
                    <a
                      key={item.arch}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-xl border p-3 transition-all duration-300 hover:scale-[1.01] ${
                        item.recommended
                          ? "border-brand/30 bg-brand/5 hover:border-brand/50 hover:shadow-lg hover:shadow-brand/10"
                          : "border-border bg-card/50 hover:border-border/80 hover:bg-card"
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        item.recommended
                          ? "bg-brand/10 text-brand"
                          : "bg-border/50 text-muted group-hover:bg-brand/10 group-hover:text-brand"
                      }`}>
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{item.arch}</p>
                          {item.recommended && (
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand uppercase">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted truncate">{item.desc}</p>
                      </div>
                      <Download className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-brand" />
                    </a>
                  ))}
                </div>
              </div>

              {/* TV section */}
              <div className="border-t border-border/50 pt-5">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <Tv className="h-3.5 w-3.5" />
                  TV
                </p>
                <a
                  href={TV_APK}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3 transition-all duration-300 hover:border-brand/30 hover:bg-card hover:scale-[1.01] hover:shadow-lg hover:shadow-brand/10"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-border/50 text-muted transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                    <Tv className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Universal (all TV devices)</p>
                    <p className="mt-0.5 text-xs text-muted">Android TV, Fire TV, Chromecast, Nvidia Shield</p>
                  </div>
                  <Download className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-brand" />
                </a>
              </div>

              {/* Windows section */}
              <div className="border-t border-border/50 pt-5">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <MonitorPlay className="h-3.5 w-3.5" />
                  Windows
                </p>
                <div className="space-y-2">
                  <a
                    href={WINDOWS_MSI}
                    className="group flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 p-3 transition-all duration-300 hover:border-brand/50 hover:scale-[1.01] hover:shadow-lg hover:shadow-brand/10"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <MonitorPlay className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">Windows 10/11 · 64-bit</p>
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand uppercase">
                          Recommended
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">MSI installer — best for most PCs</p>
                    </div>
                    <Download className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-brand" />
                  </a>
                  <a
                    href={WINDOWS_EXE}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3 transition-all duration-300 hover:border-brand/30 hover:bg-card hover:scale-[1.01] hover:shadow-lg hover:shadow-brand/10"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-border/50 text-muted transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                      <MonitorPlay className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Windows EXE installer</p>
                      <p className="mt-0.5 text-xs text-muted">Single-file setup — the same full desktop app</p>
                    </div>
                    <Download className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-brand" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const FAQ_ITEMS = [
  {
    q: "Is MaxStream free?",
    a: "Yes. MaxStream is completely free and open-source. There are no subscriptions, ads, or in-app purchases.",
  },
  {
    q: "What devices are supported?",
    a: "MaxStream runs on Android phones and tablets (Android 5.0+), Android TV devices, and Windows 10/11 PCs (64-bit). iOS is not supported.",
  },
  {
    q: "Does MaxStream have a Windows app?",
    a: "Yes. The native Windows desktop app uses mpv for playback, supports offline downloads, and shares your watchlist and watch history with the mobile and TV apps. Download the MSI installer for most PCs, or the EXE installer for a single-file setup.",
  },
  {
    q: "Do I need an account?",
    a: "You need to sign in (via email or device code) to use cloud sync. Without signing in you can still browse, but your watchlist, watch history, and progress won't sync.",
  },
  {
    q: "How do I install the APK?",
    a: "Download the APK from this page, then open it on your device. You may need to enable 'Install from unknown sources' in your device settings. On Android TV, use the 'Send files to TV' app or a USB drive.",
  },
  {
    q: "Does it work on Fire TV / Fire Stick?",
    a: "Yes. Sideload the TV APK using the Downloader app or ADB. The app is built for Android TV and works on Fire OS devices.",
  },
  {
    q: "How do I update?",
    a: "On Android and Android TV, the app checks GitHub for new releases automatically and prompts you to install updates in-app. The Windows app can also download and install updates itself, or you can run the latest MSI/EXE installer over the existing install.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative border-t border-border">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand/[0.02] to-transparent" />
      <div className="relative mx-auto max-w-3xl px-4 py-24 sm:px-6 sm:py-32">
        <RevealDiv className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Frequently asked{" "}
            <span className="gradient-text-static">questions</span>
          </h2>
        </RevealDiv>

        <div className="mt-12 space-y-3 sm:mt-16">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <RevealDiv key={i} delay={i * 60}>
                <div
                  className={`group overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isOpen
                      ? "border-brand/30 bg-card shadow-lg shadow-brand/5"
                      : "border-border/50 bg-card/50 hover:border-border hover:bg-card"
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center gap-4 p-5 text-left sm:p-6"
                  >
                    {/* Number indicator */}
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      isOpen
                        ? "bg-brand text-white shadow-lg shadow-brand/30"
                        : "bg-border/50 text-muted group-hover:bg-brand/10 group-hover:text-brand"
                    }`}>
                      {i + 1}
                    </span>

                    <span className="flex-1 text-sm font-semibold sm:text-base">
                      {item.q}
                    </span>

                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-brand" : ""
                      }`}
                    />
                  </button>

                  <div className={`faq-answer ${isOpen ? "open" : ""}`}>
                    <div>
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                        <div className="ml-12 border-l-2 border-brand/20 pl-4">
                          <p className="text-sm leading-relaxed text-muted">
                            {item.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealDiv>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Footer({ stats }: { stats: RepoStats }) {
  const version = stats.version ? `v${stats.version}` : "Latest";
  return (
    <footer className="relative border-t border-border">
      {/* Gradient divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {/* Brand */}
          <div className="sm:col-span-1">
            <a href="#" className="flex items-center gap-2.5">
              <img src="/app_icon.png" alt="" className="h-8 w-8 rounded-xl" />
              <span className="text-lg font-bold">MaxStream</span>
            </a>
            <p className="mt-3 text-sm leading-relaxed text-muted max-w-xs">
              Free, open-source streaming app for Android, Android TV, and
              Windows.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="https://github.com/TeamMaxStream/MaxStream"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted transition-all hover:border-brand/30 hover:text-foreground"
              >
                <Code2 className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/TeamMaxStream/MaxStream/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted transition-all hover:border-brand/30 hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="sm:col-span-1">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Product
            </h4>
            <div className="mt-4 space-y-2.5">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="block text-sm text-muted transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <div className="sm:col-span-1">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Resources
            </h4>
            <div className="mt-4 space-y-2.5">
              <a
                href="https://github.com/TeamMaxStream/MaxStream"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                <Code2 className="h-3.5 w-3.5" />
                Source Code
              </a>
              <a
                href={RELEASES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                <Tag className="h-3.5 w-3.5" />
                Release {version}
              </a>
              <a
                href="/status"
                className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                <Activity className="h-3.5 w-3.5" />
                Server Status
              </a>
              <a
                href="https://github.com/TeamMaxStream/MaxStream/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Report Issue
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} MaxStream. Open-source under MIT License.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <HardDriveDownload className="h-3.5 w-3.5" />
              {formatCount(stats.downloads)} downloads
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" />
              {formatCount(stats.stars)} stars
            </span>
            {/* The real state lives on /status; never claim it from here. */}
            <a
              href="/status"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
              </span>
              Live server status
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
