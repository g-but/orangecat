# AI Model System - Complete Guide

**Last Updated:** 2026-01-18
**Status:** Implemented

---

## Overview

OrangeCat's AI model system is designed to be **effortless for beginners** while **powerful for advanced users**.

**The golden rule:** Users can start chatting with AI immediately, without any setup or configuration.

---

## User Experience

### For Non-Technical Users (Default)

```
1. Sign up to OrangeCat
2. Open My Cat chat
3. Start talking immediately
   ↓
✓ Free AI model automatically selected
✓ Zero configuration needed
✓ 100% private (no data stored)
✓ 10 free messages per day
```

**Model Used:** Llama 4 Maverick (free tier via OpenRouter)
- Fast responses
- Good quality
- No API costs
- Rate limited to prevent abuse

### For Power Users (Optional Upgrade)

Users can optionally:

1. **Add API Key** (BYOK - Bring Your Own Key)
   - OpenRouter key → Access to 200+ models
   - OR individual keys (OpenAI, Anthropic, Google, etc.)

2. **Run Locally** (Ultimate Privacy)
   - Install Ollama
   - Download models
   - 100% private, zero cloud data

3. **Choose Specific Models**
   - GPT-4o for best quality
   - Claude 3.5 for reasoning
   - Gemini 2.0 for huge context
   - Grok for real-time data

---

## Technical Architecture

### Model Registry (SSOT)

**Location:** `src/config/model-registry.ts`

Single source of truth for all AI models:

```typescript
export const MODEL_REGISTRY: Record<string, ModelMetadata> = {
  'groq/mixtral-8x7b': {
    id: 'groq/mixtral-8x7b',
    name: 'Mixtral 8x7B',
    provider: 'Groq',
    tier: 'freemium',
    availability: 'cloud',
    requiresApiKey: false, // Use server key
    // ... more metadata
  },

  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    tier: 'paid',
    requiresApiKey: true, // User must provide
    // ... more metadata
  },

  'local/llama-3.1-8b': {
    id: 'local/llama-3.1-8b',
    name: 'Llama 3.1 8B (Local)',
    provider: 'Meta (via Ollama)',
    tier: 'free',
    availability: 'local',
    requiresApiKey: false, // Runs on user's computer
    // ... more metadata
  },
};
```

**Benefits:**
- ✅ One place to define all models
- ✅ Easy to add new models
- ✅ Consistent metadata across app
- ✅ Type-safe model selection

---

### Unified AI Client

**Location:** `src/lib/ai/unified-client.ts`

Single interface for all providers:

```typescript
const client = new UnifiedAIClient(config);

// Works with ANY model
const response = await client.chat({
  model: 'groq/mixtral-8x7b', // OR 'openai/gpt-4o' OR 'local/llama-3.1-8b'
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true,
});
```

**Supported Providers:**
- ✅ OpenRouter (200+ models, one API key)
- ✅ OpenAI (GPT-4o, GPT-4o-mini, etc.)
- ✅ Anthropic (Claude 3.5 Sonnet, Opus 4)
- ✅ Google (Gemini 2.0 Flash, Pro)
- ✅ X.AI (Grok 2)
- ✅ Groq (ultra-fast inference)
- ✅ Together AI (open models)
- ✅ Ollama (local models)
- ✅ LM Studio (local models)

---

### API Endpoint

**Location:** `src/app/api/cat/chat/route.ts`

**Default Behavior:**
```typescript
// Non-technical user sends message
POST /api/cat/chat
{
  "message": "I want to make money"
}

// Response uses FREE model automatically
// No configuration needed
// User doesn't even know which model was used (unless they check)
```

**Power User with BYOK:**
```typescript
// User with API key can choose model
POST /api/cat/chat
Headers: { 'x-openrouter-key': 'sk-...' }
{
  "message": "I want to make money",
  "model": "anthropic/claude-3.5-sonnet" // Specific model
}

// OR auto-select best model
{
  "message": "Complex reasoning task",
  "model": "auto" // Auto-router selects best model
}
```

---

## Model Selection Logic

### Priority System

```
1. User Specifies Model → Use that model
2. User Has BYOK → Auto-select from all models
3. User on Free Tier → Auto-select from free models only
4. Fallback → DEFAULT_FREE_MODEL_ID
```

### Auto-Router

Smart model selection based on task:

```typescript
const route = autoRouter.selectModel({
  message: "Write a complex function",
  conversationHistory: [...],
  allowedModels: availableModels,
});

// Returns best model for the task
// - Code tasks → Models with function calling
// - Creative tasks → Models with large context
// - Vision tasks → Models with vision support
```

---

## Security

### API Key Storage

**Three Tiers:**

#### 1. Free Tier (Zero User Risk)
```typescript
// Server uses its own API key
const apiKey = process.env.GROQ_API_KEY; // Server-side only

// User never sees this
// User never pays for this
// It's OrangeCat's cost
```

#### 2. Ephemeral BYOK (Most Secure)
```typescript
// User's key sent per-request in header
// NEVER stored in database
// Cleared from memory after use

fetch('/api/cat/chat', {
  headers: {
    'x-openrouter-key': userKey, // Ephemeral
  },
});
```

#### 3. Encrypted Storage (Opt-In Convenience)
```typescript
// User explicitly opts in
// Password-based encryption
// Zero-knowledge (server can't decrypt)

const encrypted = await encryptApiKey(apiKey, userPassword);
// Store encrypted blob in DB
// Decrypt on client with password
```

**Default:** Ephemeral (most secure)

---

## Model Categories

### Free Tier
- ✅ Llama 4 Maverick (default)
- ✅ Llama 3.3 70B
- ✅ Gemini 2.0 Flash
- ✅ DeepSeek R1
- ✅ Qwen QWQ 32B

**Limits:** 10 messages/day on platform key

### Premium (BYOK Required)
- 💎 GPT-4o (best overall)
- 💎 Claude 3.5 Sonnet (best reasoning)
- 💎 Claude Opus 4 (most capable)
- 💎 Gemini 2.0 Pro (2M context)
- 💎 Grok 2 (real-time data)

**Limits:** User's API key limits

### Local (Ultimate Privacy)
- 🔒 Llama 3.1 8B (fast, 16GB RAM)
- 🔒 Llama 3.1 70B (best quality, 64GB RAM)
- 🔒 Mistral 7B (lightweight, 8GB RAM)

**Limits:** Hardware only

---

## User Interface

### Model Status Badge

**Location:** `src/components/ai-chat/ModelStatusBadge.tsx`

Shows current model with hover details:

```tsx
<ModelStatusBadge
  modelName="Llama 4 Maverick"
  isFree={true}
  messagesRemaining={7}
  onUpgrade={() => showModelSelector()}
/>
```

**Appearance:**
```
┌─────────────┐
│ ⚡ Free     │  ← Hover for details
└─────────────┘
```

**On Hover:**
```
┌──────────────────────────────────┐
│ ✨ Current Model                 │
│ Llama 4 Maverick                 │
│                                  │
│ ┌────────────────────────────┐  │
│ │ Free Messages  7 remaining │  │
│ │                            │  │
│ │ You're using a free AI     │  │
│ │ model. No setup required.  │  │
│ │                            │  │
│ │ [Upgrade to Premium]       │  │
│ └────────────────────────────┘  │
│                                  │
│ ✓ Benefits:                      │
│ • No data stored                 │
│ • 100% private                   │
│ • Fast responses                 │
└──────────────────────────────────┘
```

**For BYOK Users:**
```
┌─────────────┐
│ 👑 GPT-4o   │  ← Crown icon
└─────────────┘
```

---

## Implementation Status

### ✅ Completed

- [x] Model Registry created
- [x] UnifiedAIClient built
- [x] Cat chat API updated
- [x] Default free tier working
- [x] BYOK support implemented
- [x] Model status badge created
- [x] Security measures in place

### 🚧 Next Steps

- [ ] Model selector UI component
- [ ] Local model detection & setup wizard
- [ ] OpenRouter integration testing
- [ ] Add model switching to chat UI
- [ ] Model comparison view
- [ ] Usage tracking per model
- [ ] Cost calculator for paid models

---

## Adding New Models

### 1. Add to Registry

```typescript
// src/config/model-registry.ts

'newprovider/newmodel': {
  id: 'newprovider/newmodel',
  name: 'New Model Name',
  provider: 'New Provider',
  tier: 'free', // or 'paid'
  availability: 'cloud', // or 'local' or 'both'
  requiresApiKey: true, // or false
  // ... other metadata
},
```

### 2. Add Provider Handler (if needed)

```typescript
// src/lib/ai/unified-client.ts

private async chatNewProvider(options, modelMeta) {
  const apiKey = this.config.apiKeys?.newprovider;

  return fetch('https://api.newprovider.com/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
    }),
  });
}
```

### 3. Route in Main Client

```typescript
// src/lib/ai/unified-client.ts

case 'New Provider':
  return this.chatNewProvider(options, modelMeta);
```

### 4. Done!

Model is now available everywhere:
- ✅ Cat chat
- ✅ AI assistants
- ✅ Auto-router
- ✅ Model selector UI

---

## Best Practices

### For Developers

**DO:**
- ✅ Always use MODEL_REGISTRY for model metadata
- ✅ Use UnifiedAIClient for all AI calls
- ✅ Handle streaming responses properly
- ✅ Show loading states
- ✅ Handle errors gracefully
- ✅ Track usage for free tier users

**DON'T:**
- ❌ Hardcode model IDs in components
- ❌ Bypass the unified client
- ❌ Store API keys in plaintext
- ❌ Expose API keys in client code
- ❌ Make assumptions about model availability

### For UX

**DO:**
- ✅ Default to free tier (zero friction)
- ✅ Show which model is being used (badge)
- ✅ Explain upgrade benefits clearly
- ✅ Make model switching easy
- ✅ Show usage limits transparently

**DON'T:**
- ❌ Force users to configure before use
- ❌ Hide which model is being used
- ❌ Surprise users with costs
- ❌ Make local setup too technical
- ❌ Overwhelm with model choices

---

## References

- **Model Registry:** `src/config/model-registry.ts`
- **Unified Client:** `src/lib/ai/unified-client.ts`
- **Chat API:** `src/app/api/cat/chat/route.ts`
- **Status Badge:** `src/components/ai-chat/ModelStatusBadge.tsx`
- **Existing Models:** `src/config/ai-models.ts`

---

## Support

For questions or issues:
- Check model registry for available models
- Verify API keys are correctly configured
- Check free tier usage limits
- Test with different models
- Review error messages in console

---

**Remember:** The goal is **instant AI access** for everyone, with optional power features for those who want them.
