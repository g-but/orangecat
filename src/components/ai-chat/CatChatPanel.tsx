/**
 * CAT CHAT PANEL RE-EXPORT
 *
 * This file re-exports from the modular CatChatPanel folder for backward compatibility.
 * The actual implementation is now split into smaller, maintainable modules.
 *
 * @see ./CatChatPanel/index.tsx - Main orchestrator component
 * @see ./CatChatPanel/hooks/ - Custom hooks for chat state, voice, local provider
 * @see ./CatChatPanel/components/ - Subcomponents
 */

export { CatChatPanel } from './CatChatPanel/index';
export { default } from './CatChatPanel/index';
