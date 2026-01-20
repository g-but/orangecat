/**
 * Local AI Model Detection
 *
 * Utilities for detecting and validating local AI model runtimes.
 * Supports Ollama and LM Studio (OpenAI-compatible).
 */

export interface LocalModelRuntime {
  type: 'ollama' | 'lmstudio' | 'openai_compatible';
  baseUrl: string;
  available: boolean;
  models?: string[];
  error?: string;
}

export interface DetectLocalModelsResult {
  ollama: LocalModelRuntime;
  lmstudio: LocalModelRuntime;
  availableModels: string[];
  hasAnyRuntime: boolean;
}

/**
 * Detect Ollama installation
 */
async function detectOllama(): Promise<LocalModelRuntime> {
  const baseUrl = 'http://localhost:11434';
  
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    
    if (!response.ok) {
      return {
        type: 'ollama',
        baseUrl,
        available: false,
        error: `HTTP ${response.status}`,
      };
    }
    
    const data = await response.json();
    const models = data?.models?.map((m: any) => m.name) || [];
    
    return {
      type: 'ollama',
      baseUrl,
      available: true,
      models,
    };
  } catch (error) {
    return {
      type: 'ollama',
      baseUrl,
      available: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Detect LM Studio installation
 */
async function detectLMStudio(): Promise<LocalModelRuntime> {
  const baseUrl = 'http://localhost:1234';
  
  try {
    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    
    if (!response.ok) {
      return {
        type: 'lmstudio',
        baseUrl,
        available: false,
        error: `HTTP ${response.status}`,
      };
    }
    
    const data = await response.json();
    const models = data?.data?.map((m: any) => m.id) || [];
    
    return {
      type: 'lmstudio',
      baseUrl,
      available: true,
      models,
    };
  } catch (error) {
    return {
      type: 'lmstudio',
      baseUrl,
      available: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Detect all local AI runtimes
 */
export async function detectLocalModels(): Promise<DetectLocalModelsResult> {
  const [ollama, lmstudio] = await Promise.all([
    detectOllama(),
    detectLMStudio(),
  ]);
  
  const availableModels = [
    ...(ollama.models || []),
    ...(lmstudio.models || []),
  ];
  
  return {
    ollama,
    lmstudio,
    availableModels,
    hasAnyRuntime: ollama.available || lmstudio.available,
  };
}

/**
 * Test connection to a specific local runtime
 */
export async function testLocalRuntime(
  type: 'ollama' | 'lmstudio',
  baseUrl?: string
): Promise<{ success: boolean; error?: string; models?: string[] }> {
  const url = baseUrl || (type === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234');
  const endpoint = type === 'ollama' ? '/api/tags' : '/v1/models';
  
  try {
    const response = await fetch(`${url}${endpoint}`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    
    const data = await response.json();
    const models = type === 'ollama'
      ? data?.models?.map((m: any) => m.name) || []
      : data?.data?.map((m: any) => m.id) || [];
    
    return {
      success: true,
      models,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Get recommended first model for a runtime
 */
export function getRecommendedFirstModel(type: 'ollama' | 'lmstudio'): string {
  return type === 'ollama' ? 'mistral' : 'mistral-7b-instruct';
}
