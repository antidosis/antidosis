/**
 * Terminal Input Engine
 * =====================
 * Advanced input processing: pipelines, structured queries, reverse-i-search.
 */

export interface PipelineStage {
  cmd: string;
  args: string[];
}

export interface StructuredQuery {
  filters: Record<string, string>;
  sort?: string;
  order?: "asc" | "desc";
  limit?: number;
  rawQuery: string;
}

// ─── Pipeline Parsing ────────────────────────────────────────

export function parsePipeline(input: string): PipelineStage[] | null {
  if (!input.includes("|")) return null;
  const segments = input.split(/\s*\|\s*/).filter(Boolean);
  if (segments.length < 2) return null;

  const stages: PipelineStage[] = [];
  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed.startsWith("/")) continue;
    const parts = trimmed.slice(1).split(/\s+/);
    stages.push({ cmd: parts[0].toLowerCase(), args: parts.slice(1) });
  }
  return stages.length >= 2 ? stages : null;
}

// ─── Structured Query Parsing ───────────────────────────────

const SORTABLE_FIELDS = new Set([
  "recent",
  "newest",
  "oldest",
  "title",
  "value",
  "rating",
  "distance",
]);

export function parseStructuredQuery(input: string): StructuredQuery | null {
  // Match key:value pairs, quoted strings, and bare tokens
  const filters: Record<string, string> = {};
  const tokens: string[] = [];

  // Regex: key:value, "quoted string", or bare word
  const regex = /(\w+):([^\s"]+|"[^"]*")|"([^"]*)"|(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match[1] && match[2]) {
      const key = match[1].toLowerCase();
      let value = match[2];
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      filters[key] = value;
    } else if (match[3]) {
      tokens.push(match[3]);
    } else if (match[4]) {
      tokens.push(match[4]);
    }
  }

  // Extract sort directive
  let sort: string | undefined;
  let order: "asc" | "desc" = "desc";
  for (const token of [...tokens]) {
    const lower = token.toLowerCase();
    if (SORTABLE_FIELDS.has(lower)) {
      sort = lower;
      if (lower === "oldest") order = "asc";
    }
  }

  // Extract limit
  let limit: number | undefined;
  if (filters.limit) {
    limit = parseInt(filters.limit, 10);
    delete filters.limit;
  }

  // If no filters and no tokens that look like structured queries, return null
  const hasStructuredFilters =
    Object.keys(filters).length > 0 || sort !== undefined || limit !== undefined;
  if (!hasStructuredFilters) return null;

  return { filters, sort, order, limit, rawQuery: input };
}

export function buildQueryUrl(basePath: string, query: StructuredQuery): string {
  const params = new URLSearchParams();

  // Map common filter keys to API params
  const keyMap: Record<string, string> = {
    status: "status",
    skill: "skill",
    tag: "skill",
    location: "location",
    loc: "location",
    type: "exchangeMode",
    mode: "exchangeMode",
    mine: "mine",
    me: "mine",
    pending: "status",
    active: "status",
    completed: "status",
    open: "status",
    from: "fromDate",
    to: "toDate",
    before: "toDate",
    after: "fromDate",
    near: "location",
  };

  for (const [key, value] of Object.entries(query.filters)) {
    const apiKey = keyMap[key] || key;
    params.append(apiKey, value);
  }

  if (query.sort) {
    const sortMap: Record<string, string> = {
      recent: "createdAt",
      newest: "createdAt",
      oldest: "createdAt",
      title: "title",
      value: "offerValue",
      rating: "ratingAvg",
      distance: "distance",
    };
    const sortField = sortMap[query.sort] || query.sort;
    params.append("sortBy", sortField);
    if (query.order) {
      params.append("order", query.order);
    }
  }

  if (query.limit) {
    params.append("limit", String(query.limit));
  }

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

// ─── Reverse-i-search ───────────────────────────────────────

export interface SearchMatch {
  command: string;
  highlightIndex: number;
  matchLength: number;
}

export function reverseISearch(
  history: string[],
  query: string,
  startIndex: number
): { match: SearchMatch | null; newIndex: number } {
  if (!query || history.length === 0) return { match: null, newIndex: -1 };

  const lowerQuery = query.toLowerCase();

  // Search backwards from startIndex
  for (let i = startIndex; i >= 0; i--) {
    const cmd = history[i];
    const lowerCmd = cmd.toLowerCase();
    const idx = lowerCmd.indexOf(lowerQuery);
    if (idx !== -1) {
      return {
        match: { command: cmd, highlightIndex: idx, matchLength: lowerQuery.length },
        newIndex: i - 1,
      };
    }
  }

  // Wrap around to end
  for (let i = history.length - 1; i > startIndex; i--) {
    const cmd = history[i];
    const lowerCmd = cmd.toLowerCase();
    const idx = lowerCmd.indexOf(lowerQuery);
    if (idx !== -1) {
      return {
        match: { command: cmd, highlightIndex: idx, matchLength: lowerQuery.length },
        newIndex: i - 1,
      };
    }
  }

  return { match: null, newIndex: -1 };
}

// ─── Argument Autocomplete Sources ──────────────────────────

export type ArgSource = "users" | "channels" | "needs" | "contracts" | "skills" | "locations";

export function getExpectedArgType(cmd: string, argIndex: number): ArgSource | null {
  const map: Record<string, ArgSource[]> = {
    dm: ["users"],
    msg: ["users"],
    message: ["users"],
    profile: ["users"],
    friend: ["users"],
    unfriend: ["users"],
    block: ["users"],
    unblock: ["users"],
    chat: ["channels"],
    channel: ["channels"],
    need: ["needs"],
    contract: ["contracts"],
    sign: ["contracts"],
    complete: ["contracts"],
    cancel: ["contracts"],
    terms: ["contracts"],
    remind: ["contracts"],
    escalate: ["contracts"],
    review: ["contracts"],
    accept: ["needs"],
    skill: ["skills"],
    location: ["locations"],
  };
  const sources = map[cmd];
  if (!sources) return null;
  return argIndex < sources.length ? sources[argIndex] : null;
}
