/// <reference types="node" />

const GITHUB_API = "https://api.github.com/repos/TeamMaxStream/MaxStream";

/** Used only when GitHub is unreachable and no previous snapshot exists. */
export const APP_VERSION = "1.8.0";
const CACHE_SECONDS = 3600;

export const DOWNLOADS = {
  arm64: "maxstream-arm64-v8a.apk",
  arm32: "maxstream-armeabi-v7a.apk",
  x86_64: "maxstream-x86_64.apk",
  tv: "maxstream-tv.apk",
  msi: "MaxStream-Desktop.msi",
  exe: "MaxStream-Dex.exe",
} as const;

export interface ReleaseAsset {
  name: string;
  size: number;
  downloadCount: number;
}

export interface ReleaseInfo {
  tag: string;
  version: string;
  publishedAt: string;
  assets: ReleaseAsset[];
}

export interface RepoStats {
  version: string;
  stars: number;
  forks: number;
  downloads: number;
  releasePublishedAt: string;
  /** When the numbers were last fetched from GitHub (ISO string). */
  fetchedAt: string;
}

interface CoreStats {
  stars: number;
  forks: number;
  releases: ReleaseInfo[];
  fetchedAt: string;
}

// Module-level cache: shared by every request on a warm instance and seeded
// at build time, so static pages and their ISR refreshes reuse one lookup.
let cache: { stats: RepoStats; at: number } | null = null;
let inFlight: Promise<RepoStats> | null = null;

function headers() {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "maxstream-web",
  };
  // Unauthenticated calls are limited to 60/hour per IP, which build machines
  // and serverless egress can hit. A token raises it to 5000/hour.
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: headers(),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`GitHub ${path || "/"} -> HTTP ${res.status}`);
  return (await res.json()) as T;
}

interface RawRelease {
  tag_name: string;
  published_at: string;
  draft: boolean;
  prerelease: boolean;
  assets: Array<{ name: string; size: number; download_count: number }>;
}

/**
 * GitHub's REST API has no "total downloads" field, so the release history is
 * paged through and summed. 100 releases per page; ten pages is far beyond
 * this project's history and bounds a pathological response.
 */
async function fetchCoreStats(): Promise<CoreStats> {
  const [repo, first] = await Promise.all([
    getJson<{ stargazers_count: number; forks_count: number }>(""),
    getJson<RawRelease[]>("/releases?per_page=100&page=1"),
  ]);
  const raw = [...first];
  for (let page = 2; page <= 10 && raw.length === page * 100; page++) {
    raw.push(...(await getJson<RawRelease[]>(`/releases?per_page=100&page=${page}`)));
  }
  return {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    fetchedAt: new Date().toISOString(),
    releases: raw
      .filter((r) => !r.draft && !r.prerelease && r.published_at)
      .map((r) => ({
        tag: r.tag_name,
        version: r.tag_name.replace(/^v/i, ""),
        publishedAt: r.published_at,
        assets: r.assets.map((a) => ({
          name: a.name,
          size: a.size,
          downloadCount: a.download_count,
        })),
      })),
  };
}

function toRepoStats(core: CoreStats): RepoStats {
  const latest = [...core.releases].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  )[0];
  return {
    version: latest?.version ?? APP_VERSION,
    stars: core.stars,
    forks: core.forks,
    downloads: core.releases.reduce(
      (sum, r) => sum + r.assets.reduce((s, a) => s + a.downloadCount, 0),
      0,
    ),
    releasePublishedAt: latest?.publishedAt ?? "",
    fetchedAt: core.fetchedAt,
  };
}

const FALLBACK: RepoStats = {
  version: APP_VERSION,
  stars: 0,
  forks: 0,
  downloads: 0,
  releasePublishedAt: "",
  fetchedAt: "",
};

/**
 * Live repo stats, cached for an hour. [maxAge] > [CACHE_SECONDS] asks for
 * exactly that age (used by page ISR). Never throws: on failure the last good
 * value is served, else zeros, so one GitHub hiccup cannot break the page.
 */
export async function getRepoStats(maxAge = CACHE_SECONDS): Promise<RepoStats> {
  if (cache && Date.now() - cache.at < maxAge * 1000) return cache.stats;
  if (inFlight) return inFlight;
  inFlight = fetchCoreStats()
    .then((core) => {
      const stats = toRepoStats(core);
      cache = { stats, at: Date.now() };
      return stats;
    })
    .catch(() => cache?.stats ?? FALLBACK)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
