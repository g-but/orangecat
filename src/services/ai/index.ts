/**
 * AI Services - Barrel Export
 *
 * Exports all AI-related services for easy importing.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-08
 */

// OpenRouter Service
export {
  OpenRouterService,
  OpenRouterAPIError,
  createOpenRouterService,
  createOpenRouterServiceWithByok,
  createOpenRouterServiceFreeOnly,
  getModelForUser,
  type OpenRouterMessage,
  type ChatCompletionResult,
  type StreamChunk,
} from './openrouter';

// Auto Router
export {
  AIAutoRouter,
  createAutoRouter,
  type RoutingParams,
  type RoutingResult,
} from './auto-router';

// API Key Management (BYOK)
export {
  ApiKeyService,
  createApiKeyService,
  encryptApiKey,
  decryptApiKey,
  generateKeyHint,
  type UserApiKey,
  type PlatformUsage,
  type KeyValidationResult,
} from './api-key-service';

// Groq Service (fast, free inference)
export {
  GroqService,
  GroqAPIError,
  createGroqService,
  createGroqServiceWithByok,
  isGroqAvailable,
  GROQ_MODELS,
  DEFAULT_GROQ_MODEL,
  type GroqMessage,
  type GroqChatResult,
  type GroqStreamChunkResult,
} from './groq';
