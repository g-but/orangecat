import { WalletSelectorField } from '@/components/create/wallet-selector/WalletSelectorField';
import type { FieldGroup } from '@/components/create/types';

export const WALLET_FIELD_GROUP: FieldGroup = {
  id: 'payment',
  title: 'Bitcoin & Payments',
  description: 'Select a wallet or enter an address',
  customComponent: WalletSelectorField,
};
