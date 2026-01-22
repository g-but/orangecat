/**
 * Groq AI Service
 *
 * Fast inference with Groq's OpenAI-compatible API.
 * Free tier available - no credits required!
 *
 * Supports BYOK (Bring Your Own Key) - users can provide their own
 * Groq API keys, or fall back to platform shared key.
 *
 * Created: 2026-01-22
 */

// ==================== TYPES ====================

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqRequest {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
}

interface GroqResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
}

interface GroqStreamChunk {
  id: string;
  model: string;
  choices: Array<{
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
    index: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GroqChatResult {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  finishReason: string;
  /** Groq free tier - no cost */
  isFreeModel: boolean;
  /** Whether BYOK was used (vs platform key) */
  usedByok: boolean;
}

export interface GroqStreamChunkResult {
  content: string;
  done: boolean;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

interface GroqError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

// ==================== CONSTANTS ====================

// Groq's best free models
export const GROQ_MODELS = {
  // Fast, capable model - great for chat
  'llama-3.3-70b-versatile': {
    name: 'Llama 3.3 70B Versatile',
    contextWindow: 128000,
    maxOutputTokens: 32768,
  },
  // Very fast, good for quick responses
  'llama-3.1-8b-instant': {
    name: 'Llama 3.1 8B Instant',
    contextWindow: 128000,
    maxOutputTokens: 8192,
  },
  // Mixture of experts - very capable
  'mixtral-8x7b-32768': {
    name: 'Mixtral 8x7B',
    contextWindow: 32768,
    maxOutputTokens: 32768,
  },
  // Google's Gemma
  'gemma2-9b-it': {
    name: 'Gemma 2 9B',
    contextWindow: 8192,
    maxOutputTokens: 8192,
  },
} as const;

export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

// ==================== SERVICE CLASS ====================

export class GroqService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';
  private isByok: boolean;

  constructor(
    apiKey: string,
    options: {
      /** Whether this is a user-provided key (BYOK) */
      isByok?: boolean;
    } = {}
  ) {
    this.apiKey = apiKey;
    this.isByok = options.isByok || false;
  }

  /**
   * Check if this service is using BYOK
   */
  isUsingByok(): boolean {
    return this.isByok;
  }

  /**
   * Send a non-streaming chat completion request
   */
  async chatCompletion(params: {
    model?: string;
    messages: GroqMessage[];
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    topP?: number;
  }): Promise<GroqChatResult> {
    const {
      model = DEFAULT_GROQ_MODEL,
      messages,
      temperature = 0.7,
      maxTokens,
      systemPrompt,
      topP,
    } = params;

    // Validate model exists
    const modelConfig = GROQ_MODELS[model as keyof typeof GROQ_MODELS];
    const maxOutput = modelConfig?.maxOutputTokens || 8192;

    // Prepend system prompt if provided
    const fullMessages: GroqMessage[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const request: GroqRequest = {
      model,
      messages: fullMessages,
      temperature,
      max_tokens: maxTokens || maxOutput,
      stream: false,
    };

    // Add optional parameters if provided
    if (topP !== undefined) {
      request.top_p = topP;
    }

    const response = await this.makeRequest<GroqResponse>('/chat/completions', request);

    return {
      content: response.choices[0]?.message?.content || '',
      model: response.model,
      inputTokens: response.usage.prompt_tokens,
      outputTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
      finishReason: response.choices[0]?.finish_reason || 'stop',
      isFreeModel: true, // Groq has generous free tier
      usedByok: this.isByok,
    };
  }

  /**
   * Stream a chat completion (for real-time responses)
   */
  async *streamChatCompletion(params: {
    model?: string;
    messages: GroqMessage[];
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }): AsyncGenerator<GroqStreamChunkResult> {
    const {
      model = DEFAULT_GROQ_MODEL,
      messages,
      temperature = 0.7,
      maxTokens,
      systemPrompt,
    } = params;

    const modelConfig = GROQ_MODELS[model as keyof typeof GROQ_MODELS];
    const maxOutput = modelConfig?.maxOutputTokens || 8192;

    const fullMessages: GroqMessage[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        messages: fullMessages,
        temperature,
        max_tokens: maxTokens || maxOutput,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new GroqAPIError(
        (errorBody as GroqError).error?.message || `API error: ${response.status}`,
        'api_error',
        response.status
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new GroqAPIError('No response body', 'no_response');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let usage: { inputTokens: number; outputTokens: number; totalTokens: number } | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              yield { content: '', done: true, usage };
              return;
            }

            try {
              const parsed: GroqStreamChunk = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';

              // Capture usage from final chunk
              if (parsed.usage) {
                usage = {
                  inputTokens: parsed.usage.prompt_tokens,
                  outputTokens: parsed.usage.completion_tokens,
                  totalTokens: parsed.usage.total_tokens,
                };
              }

              if (content) {
                yield { content, done: false };
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Final yield with usage if available
    yield { content: '', done: true, usage };
  }

  // ==================== PRIVATE METHODS ====================

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  private async makeRequest<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const error = errorBody as GroqError;

      // Handle specific error types
      if (response.status === 401) {
        throw new GroqAPIError('Invalid API key', 'invalid_api_key', 401);
      }
      if (response.status === 429) {
        throw new GroqAPIError('Rate limit exceeded', 'rate_limit', 429);
      }

      throw new GroqAPIError(
        error.error?.message || `API error: ${response.status}`,
        error.error?.type || 'api_error',
        response.status
      );
    }

    return response.json();
  }
}

// ==================== ERROR CLASS ====================

export class GroqAPIError extends Error {
  type: string;
  statusCode?: number;

  constructor(message: string, type: string, statusCode?: number) {
    super(message);
    this.name = 'GroqAPIError';
    this.type = type;
    this.statusCode = statusCode;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.statusCode === 429 || this.statusCode === 503 || this.statusCode === 502;
  }
}

// ==================== FACTORY FUNCTIONS ====================

/**
 * Create a Groq service instance using platform API key
 * Used when user doesn't have BYOK
 */
export function createGroqService(): GroqService {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable not set');
  }
  return new GroqService(apiKey, { isByok: false });
}

/**
 * Create service with user's own API key (BYOK)
 */
export function createGroqServiceWithByok(userApiKey: string): GroqService {
  return new GroqService(userApiKey, { isByok: true });
}

/**
 * Check if Groq is available (platform key configured)
 */
export function isGroqAvailable(): boolean {
  return !!process.env.GROQ_API_KEY;
}
