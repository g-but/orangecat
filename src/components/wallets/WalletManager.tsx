/**
 * WALLET MANAGER RE-EXPORT
 *
 * This file re-exports from the modular WalletManager folder for backward compatibility.
 * The actual implementation is now split into smaller, maintainable modules.
 *
 * @see ./WalletManager/index.tsx - Main orchestrator component
 * @see ./WalletManager/components/ - Subcomponents (WalletCard, WalletForm, etc.)
 * @see ./WalletManager/types.ts - Shared types
 */

export { WalletManager } from './WalletManager/index';
