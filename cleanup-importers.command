#!/bin/zsh
set -euo pipefail

ROOT="/Users/cultureos/CultureOS/xCxPxAx"
cd "$ROOT"

echo "Running from: $(pwd)"

backup_branch="backup-importers-$(date +%Y%m%d-%H%M%S)"
git branch "$backup_branch"
echo "Backup branch created: $backup_branch"

remove_path() {
  local target="$1"
  if [[ -e "$target" ]]; then
    rm -rf "$target"
    echo "Removed $target"
  else
    echo "Skipped missing $target"
  fi
}

python3 <<'PY'
from pathlib import Path

root = Path("/Users/cultureos/CultureOS/xCxPxAx")


def replace_exact(rel_path: str, old: str, new: str) -> None:
    path = root / rel_path
    text = path.read_text()
    if old not in text:
        raise SystemExit(f"Expected snippet not found in {rel_path}")
    path.write_text(text.replace(old, new, 1))
    print(f"Updated {rel_path}")


replace_exact(
    "functions/src/app.ts",
    "import { importRouter } from './routes/import';\n",
    "",
)
replace_exact(
    "functions/src/app.ts",
    "mount('/', importRouter);\n",
    "",
)
replace_exact(
    "functions/src/index.ts",
    "export * from './scraper/ingestScheduler';\n",
    "",
)
replace_exact(
    "app/_layout.tsx",
    "      <Stack.Screen name=\"admin/import\" />\n",
    "",
)
replace_exact(
    "components/web/WebSidebar.tsx",
    "  { label: 'Import', icon: 'cloud-upload-outline', iconActive: 'cloud-upload', route: '/admin/import', matchPrefix: true },\n",
    "",
)
replace_exact(
    "app/admin/dashboard/index.tsx",
    "  {\n"
    "    id: 'import',\n"
    "    label: 'Bulk Import',\n"
    "    description: 'CSV / JSON import',\n"
    "    icon: 'document-text-outline',\n"
    "    color: CultureTokens.teal,\n"
    "    route: '/admin/import',\n"
    "  },\n",
    "",
)
replace_exact(
    "app/admin/cockpit.tsx",
    "            <View style={{ width: columnWidth(2) }}>\n"
    "              <ActionItem\n"
    "                delay={680}\n"
    "                title=\"Ingestion\"\n"
    "                description=\"Manual JSON/CSV imports\"\n"
    "                icon=\"cloud-upload-outline\"\n"
    "                color={CultureTokens.indigo}\n"
    "                onPress={() => router.push('/admin/import')}\n"
    "              />\n"
    "            </View>\n",
    "",
)
replace_exact(
    "lib/api.ts",
    "  IngestSource,\n"
    "  IngestionJob,\n"
    "  IngestScheduleInterval,\n",
    "",
)
replace_exact(
    "lib/api.ts",
    ", IngestSource, IngestionJob, IngestScheduleInterval",
    "",
)
replace_exact(
    "lib/api.ts",
    "  // ── Data Import ──────────────────────────────────────────────────────────\n"
    "  importJson: (payload: {\n"
    "    events: Record<string, unknown>[];\n"
    "    source?: 'manual' | 'json-api';\n"
    "    city?: string;\n"
    "    country?: string;\n"
    "  }) => request<{ ok: boolean; imported: number; updated: number; skipped: number; errors: string[]; source: string }>('POST', 'api/admin/import/json', payload),\n"
    "\n"
    "  importUrl: (payload: { url: string; city?: string; country?: string }) =>\n"
    "    request<{ ok: boolean; imported: number; updated: number; skipped: number; errors: string[]; source: string }>('POST', 'api/admin/import/url', payload),\n"
    "\n"
    "  importClear: (source: 'manual' | 'url-scrape' | 'cityofsydney' | 'json-api' | 'all' = 'all') =>\n"
    "    request<{ ok: boolean; deleted: number; source: string }>('DELETE', 'api/admin/import/clear', { source, confirm: true }),\n"
    "\n"
    "  importSources: () =>\n"
    "    request<{ sources: { source: string; count: number; latest: string }[]; total: number }>('GET', 'api/admin/import/sources'),\n"
    "\n"
    "  // ── Ingest Source Management ─────────────────────────────────────────────\n"
    "  ingestSourcesList: () =>\n"
    "    request<{ sources: IngestSource[] }>('GET', 'api/admin/ingest/sources'),\n"
    "\n"
    "  ingestSourceCreate: (payload: { name: string; url: string; city?: string; country?: string; enabled?: boolean; scheduleInterval?: IngestScheduleInterval | null }) =>\n"
    "    request<{ ok: boolean; source: IngestSource }>('POST', 'api/admin/ingest/sources', payload),\n"
    "\n"
    "  ingestSourceUpdate: (id: string, payload: Partial<{ name: string; url: string; city: string; country: string; enabled: boolean; scheduleInterval: IngestScheduleInterval | null }>) =>\n"
    "    request<{ ok: boolean }>('PUT', `api/admin/ingest/sources/${id}`, payload),\n"
    "\n"
    "  ingestSourceDelete: (id: string) =>\n"
    "    request<{ ok: boolean }>('DELETE', `api/admin/ingest/sources/${id}`),\n"
    "\n"
    "  ingestSourceRun: (id: string) =>\n"
    "    request<{ ok: boolean; imported: number; updated: number; skipped: number; errors: string[]; source: string; jobId?: string }>('POST', `api/admin/ingest/sources/${id}/run`),\n"
    "\n"
    "  // ── Ingestion Job History ────────────────────────────────────────────────\n"
    "  ingestJobsList: (params?: { limit?: number; sourceId?: string; status?: string }) => {\n"
    "    const qs = new URLSearchParams();\n"
    "    if (params?.limit != null) qs.set('limit', String(params.limit));\n"
    "    if (params?.sourceId) qs.set('sourceId', params.sourceId);\n"
    "    if (params?.status) qs.set('status', params.status);\n"
    "    const q = qs.toString();\n"
    "    return request<{ jobs: IngestionJob[] }>('GET', `api/admin/ingest/jobs${q ? `?${q}` : ''}`);\n"
    "  },\n"
    "\n"
    "  ingestJobRetry: (id: string) =>\n"
    "    request<{ ok: boolean; imported: number; updated: number; skipped: number; jobId?: string }>('POST', `api/admin/ingest/jobs/${id}/retry`),\n"
    "\n",
    "",
)
PY

remove_path "functions/src/handlers/import.ts"
remove_path "functions/src/services/importer.ts"
remove_path "functions/src/scraper/ingestScheduler.ts"
remove_path "app/admin/import.tsx"
remove_path "components/admin-import"

echo
echo "Checking for known importer references..."
if rg -n "admin/import|components/admin-import|services/importer|importRouter|runScheduledIngestion|api\\.admin\\.(import|ingest)|importFromUrl" app components functions/src lib; then
  echo
  echo "Importer references remain. Review the hits above before committing."
  exit 1
fi

echo
echo "Running checks..."
npm run lint
npm run typecheck

echo
echo "Cleanup complete."
echo "Backup branch: $backup_branch"
