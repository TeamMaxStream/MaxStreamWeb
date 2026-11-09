/// <reference types="node" />

import { getRepoStats } from "@/lib/github";
import Home from "./page-content";

// Longer than the hourly GitHub cache so a browser reload can never serve
// stale numbers, while static hosting still gets a cached HTML response.
export const revalidate = 900;

export default async function Page() {
  const stats = await getRepoStats(revalidate);
  return <Home stats={stats} />;
}
