/// <reference types="node" />

import { getRepoStats } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getRepoStats();
  return Response.json(stats, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
