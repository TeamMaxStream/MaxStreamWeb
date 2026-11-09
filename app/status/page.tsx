"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Activity,
  Server,
  Cpu,
  CheckCircle2,
  XCircle,
  Search,
  Sun,
  Moon,
  
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";

const HEALTH_ENDPOINT =
  "https://maxstream-extractor.maxstream123.workers.dev/health";

interface HealthProvider {
  name: string;
  domain: string;
  type: string;
  kind?: string;
  healthy: boolean;
  status: number;
  responseMs: number;
  error?: string;
}

interface HealthData {
  timestamp: string;
  servers: HealthProvider[];
  extractors: HealthProvider[];
  summary: {
    servers: { total: number; healthy: number; unhealthy: number };
    extractors: { total: number; healthy: number; unhealthy: number };
  };
}

export default function StatusPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"servers" | "extractors">(
    "servers"
  );
  const [filter, setFilter] = useState<"all" | "healthy" | "unhealthy">("all");
  const [search, setSearch] = useState("");
  const [countdown, setCountdown] = useState(300);
  const inFlight = useRef(false);

  const fetchHealth = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(HEALTH_ENDPOINT, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setCountdown(300);
    } catch (e) {
      // Keep the last good snapshot on screen; the error banner explains that
      // the numbers may be a few minutes old.
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Failed to fetch status"
      );
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Countdown timer
  useEffect(() => {
    if (!data) return;
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [data]);

  const items = activeTab === "servers" ? data?.servers : data?.extractors;
  const summary =
    activeTab === "servers" ? data?.summary?.servers : data?.summary?.extractors;

  // Filter and search
  const matches = (p: HealthProvider) => {
    if (filter === "healthy" && !p.healthy) return false;
    if (filter === "unhealthy" && p.healthy) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q);
    }
    return true;
  };
  const filteredItems = items?.filter(matches) ?? [];
  const filtered = data?.extractors?.filter(matches) ?? [];

  // Group extractors by kind
  const extractorGroups = data?.extractors
    ? {
        webview: data.extractors.filter((e) => e.kind === "webview"),
        api: data.extractors.filter((e) => e.kind === "api"),
        native: data.extractors.filter((e) => e.kind === "native"),
      }
    : null;

  const totalHealthy =
    (data?.summary?.servers?.healthy ?? 0) +
    (data?.summary?.extractors?.healthy ?? 0);
  const totalProviders =
    (data?.summary?.servers?.total ?? 0) +
    (data?.summary?.extractors?.total ?? 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition-all hover:bg-border/50 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand" />
              <h1 className="text-lg font-bold">Server Status</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data?.timestamp && (
              <span className="hidden text-xs text-muted sm:inline">
                Next refresh in {countdown}s
              </span>
            )}
            <ThemeToggle />
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted transition-all hover:border-brand/30 hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero summary */}
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex items-center gap-3 rounded-2xl glass-card px-6 py-4">
            <div className="relative">
              <div
                className={`h-4 w-4 rounded-full ${
                  totalHealthy === totalProviders && totalProviders > 0
                    ? "bg-green-500"
                    : totalHealthy > 0
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
              {totalHealthy === totalProviders && totalProviders > 0 && (
                <div className="absolute inset-0 h-4 w-4 animate-ping rounded-full bg-green-500 opacity-50" />
              )}
            </div>
            <span className="text-2xl font-bold sm:text-3xl">
              {totalHealthy}/{totalProviders}
            </span>
            <span className="text-sm text-muted">providers healthy</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Real-time{" "}
            <span className="gradient-text-static">health status</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-muted sm:text-lg">
            Monitoring all streaming servers and extractors. Auto-refreshes
            every 5 minutes.
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Servers",
              healthy: data?.summary?.servers?.healthy ?? 0,
              total: data?.summary?.servers?.total ?? 0,
              icon: Server,
              color: "text-blue-500",
            },
            {
              label: "Extractors",
              healthy: data?.summary?.extractors?.healthy ?? 0,
              total: data?.summary?.extractors?.total ?? 0,
              icon: Cpu,
              color: "text-purple-500",
            },
            {
              label: "Healthy",
              healthy: totalHealthy,
              total: totalProviders,
              icon: CheckCircle2,
              color: "text-green-500",
            },
            {
              label: "Unhealthy",
              healthy:
                totalProviders - totalHealthy,
              total: totalProviders,
              icon: XCircle,
              color: "text-red-500",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="glass-card rounded-2xl p-4 text-center transition-all hover:scale-[1.02] sm:p-5"
            >
              <card.icon className={`mx-auto mb-2 h-5 w-5 ${card.color}`} />
              <p className="text-2xl font-bold sm:text-3xl">
                {card.label === "Healthy" || card.label === "Unhealthy"
                  ? card.healthy
                  : `${card.healthy}/${card.total}`}
              </p>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs, search, filter */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-border/30 p-1">
            {(["servers", "extractors"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setFilter("all");
                  setSearch("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-brand text-white shadow-lg shadow-brand/30"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab === "servers" ? "Servers" : "Extractors"}
                <span className="ml-1.5 text-xs opacity-70">
                  ({tab === "servers"
                    ? data?.summary?.servers?.total ?? 0
                    : data?.summary?.extractors?.total ?? 0}
                  )
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search providers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder-muted transition-all focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/20"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-1 rounded-xl bg-border/30 p-1">
              {(["all", "healthy", "unhealthy"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    filter === f
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {f === "all" ? "All" : f === "healthy" ? "Online" : "Offline"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-400 sm:flex-row sm:justify-between sm:text-left">
            <span>
              {error}
              {data && " — showing the last successful check."}
            </span>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="shrink-0 rounded-full border border-red-500/30 px-4 py-1.5 text-xs font-medium transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && !data && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-border/30"
              />
            ))}
          </div>
        )}

        {/* A failed first load shouldn't leave a blank page below the banner. */}
        {!loading && !data && !error && (
          <div className="rounded-2xl border border-border bg-card/50 p-8 text-center text-sm text-muted">
            No status data available yet.
          </div>
        )}

        {/* Servers grid */}
        {!loading && activeTab === "servers" && data && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((p, i) => (
              <StatusCard key={`${p.domain}-${i}`} provider={p} />
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full rounded-2xl border border-border bg-card/50 p-8 text-center text-sm text-muted">
                No providers match your search.
              </div>
            )}
          </div>
        )}

        {/* Extractors grouped */}
        {!loading && activeTab === "extractors" && extractorGroups && (
          <div className="space-y-8">
            {(
              [
                {
                  key: "webview",
                  label: "WebView-Based",
                  items: extractorGroups.webview,
                  icon: "🌐",
                },
                {
                  key: "api",
                  label: "API / Worker",
                  items: extractorGroups.api,
                  icon: "⚡",
                },
                {
                  key: "native",
                  label: "Native / HTTP",
                  items: extractorGroups.native,
                  icon: "🔗",
                },
              ] as const
            ).map(
              (group) =>
                group.items.length > 0 && (
                  <div key={group.key}>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="text-lg">{group.icon}</span>
                      <h3 className="text-lg font-semibold">{group.label}</h3>
                      <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500">
                        {group.items.filter((e) => e.healthy).length}/
                        {group.items.length} online
                      </span>
                      <div className="h-px flex-1 bg-border/50" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items
                        .filter(matches)
                        .map((p, i) => (
                          <StatusCard
                            key={`${p.domain}-${i}`}
                            provider={p}
                          />
                        ))}
                    </div>
                  </div>
                )
            )}
            {filtered && filtered.length === 0 && (
              <div className="rounded-2xl border border-border bg-card/50 p-8 text-center text-sm text-muted">
                No extractors match your search.
              </div>
            )}
          </div>
        )}

        {/* Last updated */}
        {data?.timestamp && (
          <div className="mt-10 text-center text-xs text-muted">
            Last updated:{" "}
            {new Date(data.timestamp).toLocaleString()} · Cached for 5 minutes
          </div>
        )}
      </main>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-xl border border-border bg-card p-2 text-muted transition-all hover:border-brand/30 hover:text-foreground"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

function StatusCard({ provider }: { provider: HealthProvider }) {
  const isHealthy = provider.healthy;
  const isUnknown = provider.status === 0 && !provider.error;

  return (
    <div
      className={`group glass-card relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-[1.01] ${
        isHealthy
          ? "hover:shadow-lg hover:shadow-green-500/5"
          : "hover:shadow-lg hover:shadow-red-500/5"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Status dot */}
        <div className="relative shrink-0">
          <div
            className={`h-3 w-3 rounded-full ${
              isHealthy
                ? "bg-green-500"
                : isUnknown
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          />
          {isHealthy && (
            <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-green-500 opacity-50" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{provider.name}</p>
            {provider.kind && (
              <span className="shrink-0 rounded-full bg-border/50 px-2 py-0.5 text-[10px] font-medium text-muted uppercase">
                {provider.kind}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted truncate">{provider.domain}</p>
        </div>

        {/* Response time */}
        <div className="shrink-0 text-right">
          {isHealthy ? (
            <span className="text-sm font-semibold text-green-500">
              {provider.responseMs}ms
            </span>
          ) : isUnknown ? (
            <span className="text-xs text-yellow-500">Unknown</span>
          ) : (
            <span className="text-xs text-red-400">
              {provider.error || `HTTP ${provider.status}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
