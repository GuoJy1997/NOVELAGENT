export const DEFAULT_LLM_MODEL = 'deepseek-v4-flash';

export type LlmFetch = typeof fetch;

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  fetchImpl?: LlmFetch;
}

export interface LlmModelRow {
  id: string;
  object: string;
  owned_by: string;
}

export interface LlmModelList {
  object: 'list';
  data: LlmModelRow[];
}

function fetchFn(config: LlmConfig): LlmFetch {
  return config.fetchImpl ?? fetch;
}

function origin(baseUrl: string) {
  return baseUrl.replace(/\/$/, '');
}

export async function listLlmModels(config: LlmConfig): Promise<LlmModelList> {
  const response = await fetchFn(config)(`${origin(config.baseUrl)}/models`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });
  if (!response.ok) throw new Error(`DeepSeek models ${response.status}`);
  const body = (await response.json()) as LlmModelList;
  if (body.object !== 'list' || !Array.isArray(body.data)) throw new Error('DeepSeek models payload invalid');
  return {
    object: 'list',
    data: body.data.map((row) => ({
      id: row.id,
      object: row.object ?? 'model',
      owned_by: row.owned_by ?? 'deepseek',
    })),
  };
}

export async function createChatUpstream(
  config: LlmConfig,
  body: { model?: string; messages?: unknown; stream?: boolean },
): Promise<Response> {
  const model = typeof body.model === 'string' && body.model.trim() !== '' ? body.model : DEFAULT_LLM_MODEL;
  return fetchFn(config)(`${origin(config.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: body.messages ?? [],
    }),
  });
}
