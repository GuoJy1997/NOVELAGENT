export type CatalogKind = 'skill' | 'command' | 'expert';

export interface HermesCatalogItem {
  id: string;
  label: string;
  hint: string;
  kind: CatalogKind;
}

export interface HermesCatalog {
  skills: HermesCatalogItem[];
  commands: HermesCatalogItem[];
  experts: HermesCatalogItem[];
}

const DEV_KEY = 'novelora-dev-key';
const GATEWAY_MODEL = 'hermes-agent';
const SKILLS_URL = '/hermes/v1/skills';
const CAPABILITIES_URL = '/hermes/v1/capabilities';
const MODELS_URL = '/hermes/v1/models';

type ListRow = { name: string; description?: string; category?: string };

type ListEnvelope = {
  object: string;
  data: ListRow[];
};

type CapabilitiesEnvelope = {
  endpoints?: {
    commands?: { path: string };
    experts?: { path: string };
  };
};

export function emptyCatalog(): HermesCatalog {
  return { skills: [], commands: [], experts: [] };
}

function sortBixinModelIds(ids: string[]): string[] {
  const unique = [...new Set(ids.filter(Boolean))];
  unique.sort((left, right) => {
    if (left === GATEWAY_MODEL) return 1;
    if (right === GATEWAY_MODEL) return -1;
    return left.localeCompare(right);
  });
  return unique;
}

async function fetchJsonModelIds(url: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const response = await fetch(url, {
      signal,
      headers: url.startsWith('/hermes/') ? authHeaders() : undefined,
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { object?: string; data?: Array<{ id?: string }> };
    if (body.object !== 'list' || !Array.isArray(body.data)) return [];
    return body.data.map((row) => row.id).filter((id): id is string => Boolean(id));
  } catch {
    return [];
  }
}

export async function fetchHermesModels(signal?: AbortSignal): Promise<string[]> {
  return sortBixinModelIds(await fetchJsonModelIds(MODELS_URL, signal));
}

/** Chat and workflow share this list: Hermes gateway + DeepSeek via the API. */
export async function listBixinModels(signal?: AbortSignal): Promise<string[]> {
  const [hermes, llm] = await Promise.all([
    fetchJsonModelIds(MODELS_URL, signal),
    fetchJsonModelIds('/api/llm/models', signal),
  ]);
  return sortBixinModelIds([...hermes, ...llm]);
}

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${DEV_KEY}` };
}

function mapRow(row: ListRow, kind: CatalogKind): HermesCatalogItem {
  return {
    id: row.name,
    label: row.name,
    hint: row.description ?? row.category ?? '',
    kind,
  };
}

async function fetchList(
  url: string,
  kind: CatalogKind,
  signal?: AbortSignal,
): Promise<HermesCatalogItem[] | null> {
  const response = await fetch(url, { signal, headers: authHeaders() });
  if (!response.ok) return null;
  const body = (await response.json()) as ListEnvelope;
  if (body.object !== 'list' || !Array.isArray(body.data)) return null;
  return body.data.map((row) => mapRow(row, kind));
}

export async function fetchHermesCatalog(signal?: AbortSignal): Promise<HermesCatalog> {
  let skills: HermesCatalogItem[] | null;
  try {
    skills = await fetchList(SKILLS_URL, 'skill', signal);
  } catch {
    return emptyCatalog();
  }
  if (skills === null) return emptyCatalog();

  try {
    const capResponse = await fetch(CAPABILITIES_URL, { signal, headers: authHeaders() });
    if (!capResponse.ok) return { skills, commands: [], experts: [] };

    const cap = (await capResponse.json()) as CapabilitiesEnvelope;
    const endpoints = cap.endpoints;

    let commands: HermesCatalogItem[] = [];
    if (endpoints?.commands?.path) {
      const rows = await fetchList(`/hermes${endpoints.commands.path}`, 'command', signal);
      commands = rows ?? [];
    }

    let experts: HermesCatalogItem[] = [];
    if (endpoints?.experts?.path) {
      const rows = await fetchList(`/hermes${endpoints.experts.path}`, 'expert', signal);
      experts = rows ?? [];
    }

    return { skills, commands, experts };
  } catch {
    return { skills, commands: [], experts: [] };
  }
}
