/**
 * Unified AI Client
 *
 * Single interface for all AI model providers:
 * - OpenAI, Anthropic, Google, X.AI, Groq
 * - OpenRouter (access to 200+ models)
 * - Local models (Ollama, LM Studio)
 */

import { MODEL_REGISTRY, type ModelMetadata } from '@/config/model-registry';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface UserModelConfig {
  // Active model
  activeModel: string;

  // API keys (encrypted or ephemeral)
  apiKeys?: {
    openai?: string;
    anthropic?: string;
    google?: string;
    xai?: string;
    groq?: string;
    openrouter?: string;
  };

  // Local config
  localConfig?: {
    endpoint: string;
    type: 'ollama' | 'lmstudio' | 'custom';
  };

  // Preferences
  preferLocal?: boolean;
  useOpenRouter?: boolean;
}

export class UnifiedAIClient {
  private config: UserModelConfig;

  constructor(config: UserModelConfig) {
    this.config = config;
  }

  /**
   * Send a chat message to the configured model
   */
  async chat(options: ChatOptions): Promise<Response> {
    const modelMeta = MODEL_REGISTRY[options.model];

    if (!modelMeta) {
      throw new Error(`Unknown model: ${options.model}`);
    }

    // Route to appropriate provider
    if (modelMeta.openRouterCompatible && this.config.useOpenRouter) {
      return this.chatOpenRouter(options, modelMeta);
    }

    if (modelMeta.ollamaCompatible && this.config.preferLocal) {
      return this.chatOllama(options, modelMeta);
    }

    // Direct provider routing
    switch (modelMeta.provider) {
      case 'OpenAI':
        return this.chatOpenAI(options, modelMeta);
      case 'Anthropic':
        return this.chatAnthropic(options, modelMeta);
      case 'Groq':
        return this.chatGroq(options, modelMeta);
      case 'Google':
        return this.chatGemini(options, modelMeta);
      case 'X.AI':
        return this.chatXAI(options, modelMeta);
      case 'Together AI':
        return this.chatTogether(options, modelMeta);
      case 'OpenRouter':
        return this.chatOpenRouter(options, modelMeta);
      default:
        if (modelMeta.availability === 'local') {
          return this.chatOllama(options, modelMeta);
        }
        throw new Error(`Provider not implemented: ${modelMeta.provider}`);
    }
  }

  /**
   * OpenRouter - Universal gateway to 200+ models
   */
  private async chatOpenRouter(
    options: ChatOptions,
    _modelMeta: ModelMetadata
  ): Promise<Response> {
    const apiKey =
      this.config.apiKeys?.openrouter || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OpenRouter API key required');
    }

    return fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://orangecat.app',
        'X-Title': 'OrangeCat',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model.replace('openrouter/', ''),
        messages: options.messages,
        stream: options.stream,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
    });
  }

  /**
   * Ollama - Local models
   */
  private async chatOllama(
    options: ChatOptions,
    _modelMeta: ModelMetadata
  ): Promise<Response> {
    const endpoint =
      this.config.localConfig?.endpoint || 'http://localhost:11434';

    // Check if Ollama is running
    try {
      await fetch(`${endpoint}/api/tags`, { method: 'GET' });
    } catch (_error) {
      throw new Error(
        'Ollama not detected. Please install and start Ollama first.'
      );
    }

    return fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model.replace('local/', ''),
        messages: options.messages,
        stream: options.stream,
        options: {
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
      }),
    });
  }

  /**
   * OpenAI - GPT models
   */
  private async chatOpenAI(
    options: ChatOptions,
    _modelMeta: ModelMetadata
  ): Promise<Response> {
    const apiKey = this.config.apiKeys?.openai;

    if (!apiKey) {
      throw new Error('OpenAI API key required');
    }

    return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model.replace('openai/', ''),
        messages: options.messages,
        stream: options.stream,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
    });
  }

  /**
   * Anthropic - Claude models
   */
  private async chatAnthropic(
    options: ChatOptions,
    _modelMeta: ModelMetadata
  ): Promise<Response> {
    const apiKey = this.config.apiKeys?.anthropic;

    if (!apiKey) {
      throw new Error('Anthropic API key required');
    }

    // Anthropic has different API format
    const systemMessage = options.messages.find(m => m.role === 'system');
    const conversationMessages = options.messages.filter(
      m => m.role !== 'system'
    );

    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model.replace('anthropic/', ''),
        messages: conversationMessages,
        system: systemMessage?.content,
        stream: options.stream,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature,
      }),
    });
  }

  /**
   * Groq - Fast inference
   */
  private async chatGroq(
    options: ChatOptions,
    _modelMeta: ModelMetadata
  ): Promise<Response> {
    const apiKey = this.config.apiKeys?.groq || process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('Groq API key required');
    }

    return fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model.replace('groq/', ''),
        messages: options.messages,
        stream: options.stream,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
    });
  }

  /**
   * Google Gemini
   */
  private async chatGemini(
    options: ChatOptions,
    _modelMeta: ModelMetadata
  ): Promise<Response> {
    const apiKey = this.config.apiKeys?.google;

    if (!apiKey) {
      throw new Error('Google API key required');
    }

    const modelName = options.model.replace('google/', '');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${
      options.stream ? 'streamGenerateContent' : 'generateContent'
    }?key=${apiKey}`;

    // Convert messages to Gemini format
    const contents = options.messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    }));

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxTokens,
        },
      }),
    });
  }

  /**
   * X.AI Grok
   */
  private async chatXAI(
    options: ChatOptions,
    _modelMeta: ModelMetadata
  ): Promise<Response> {
    const apiKey = this.config.apiKeys?.xai;

    if (!apiKey) {
      throw new Error('X.AI API key required');
    }

    return fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model.replace('xai/', ''),
        messages: options.messages,
        stream: options.stream,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
    });
  }

  /**
   * Together AI
   */
  private async chatTogether(
    options: ChatOptions,
    _modelMeta: ModelMetadata
  ): Promise<Response> {
    const apiKey = process.env.TOGETHER_API_KEY;

    if (!apiKey) {
      throw new Error('Together AI API key required');
    }

    return fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model.replace('together/', ''),
        messages: options.messages,
        stream: options.stream,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
    });
  }
}

/**
 * Helper to detect if local models are available
 */
export async function detectLocalModels(): Promise<{
  ollama: boolean;
  lmstudio: boolean;
  availableModels: string[];
}> {
  const result = {
    ollama: false,
    lmstudio: false,
    availableModels: [] as string[],
  };

  // Check Ollama
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      result.ollama = true;
      const data = await response.json();
      result.availableModels = data.models?.map((m: any) => m.name) || [];
    }
  } catch {
    // Ollama not running
  }

  // Check LM Studio
  try {
    const response = await fetch('http://localhost:1234/v1/models');
    if (response.ok) {
      result.lmstudio = true;
    }
  } catch {
    // LM Studio not running
  }

  return result;
}
