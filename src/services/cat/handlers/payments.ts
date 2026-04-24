import type { SupabaseClient } from '@supabase/supabase-js';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import { NWCClient } from '@/lib/nostr/nwc';
import { decrypt } from '@/domain/payments/encryptionService';
import { generateInvoice } from '@/domain/payments/invoiceGenerationService';
import { resolveSellerWallet, getSellerUserId } from '@/domain/payments/walletResolutionService';
import { getAdminClient } from '@/lib/supabase/admin';
import type { ResolvedWallet } from '@/domain/payments/types';
import type { ActionHandler } from './types';

export const paymentHandlers: Record<string, ActionHandler> = {
  add_wallet: async (supabase, userId, _actorId, params) => {
    // Create a savings goal or budget wallet for the user's profile.
    // Wallets require a lightning address — we use the one provided, or fall back to
    // the user's primary lightning address from their existing wallets.
    const label = params.label as string | undefined;
    if (!label?.trim()) {
      return { success: false, error: 'label is required — provide a name for the wallet (e.g. "Vacation Fund")' };
    }

    const behaviorType = (params.behavior_type as string | undefined) || 'general';
    const validBehaviorTypes = ['general', 'one_time_goal', 'recurring_budget'];
    if (!validBehaviorTypes.includes(behaviorType)) {
      return { success: false, error: `behavior_type must be one of: ${validBehaviorTypes.join(', ')}` };
    }

    // Resolve lightning address: use provided one, else look up user's primary
    let lightningAddress = (params.lightning_address as string | undefined) || null;
    if (!lightningAddress) {
      const { data: existingWallets } = await supabase
        .from(DATABASE_TABLES.WALLETS)
        .select('lightning_address')
        .eq('profile_id', userId)
        .eq('is_active', true)
        .not('lightning_address', 'is', null)
        .order('is_primary', { ascending: false })
        .limit(1);
      lightningAddress = existingWallets?.[0]?.lightning_address ?? null;
    }

    if (!lightningAddress) {
      return {
        success: false,
        error: 'No lightning address available. Add one in Settings → Wallets first, or provide a lightning_address parameter.',
      };
    }

    const walletRecord: Record<string, unknown> = {
      profile_id: userId,
      label: label.trim(),
      lightning_address: lightningAddress,
      is_active: true,
      is_primary: false,
      behavior_type: behaviorType,
      category: (params.category as string | undefined) || 'general',
    };

    if (params.description) { walletRecord.description = params.description as string; }

    // Goal fields (one_time_goal)
    if (params.goal_amount !== undefined) { walletRecord.goal_amount = params.goal_amount as number; }
    if (params.goal_currency) { walletRecord.goal_currency = params.goal_currency as string; }
    if (params.goal_deadline) { walletRecord.goal_deadline = params.goal_deadline as string; }

    // Budget fields (recurring_budget)
    if (params.budget_amount !== undefined) { walletRecord.budget_amount = params.budget_amount as number; }
    if (params.budget_period) { walletRecord.budget_period = params.budget_period as string; }

    const { data, error } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .insert(walletRecord)
      .select('id, label, behavior_type, category, goal_amount, goal_currency, goal_deadline, budget_amount, budget_period')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const parts: string[] = [label.trim()];
    if (behaviorType === 'one_time_goal' && params.goal_amount) {
      parts.push(`goal: ${params.goal_amount} ${params.goal_currency ?? 'BTC'}`);
      if (params.goal_deadline) { parts.push(`by ${params.goal_deadline}`); }
    } else if (behaviorType === 'recurring_budget' && params.budget_amount) {
      parts.push(`${params.budget_amount} BTC/${params.budget_period ?? 'month'}`);
    }

    return {
      success: true,
      data: {
        ...data,
        displayMessage: `💰 Wallet created: ${parts.join(' — ')}`,
      },
    };
  },

  send_payment: async (supabase, userId, _actorId, params) => {
    const amountBtc = params.amount_btc as number;
    const recipient = params.recipient as string;
    const memo = (params.memo as string) || 'Payment via My Cat';

    if (!amountBtc || amountBtc <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // 1. Get sender's NWC wallet (user can only read their own wallets via RLS)
    const { data: senderWallets } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .select('nwc_connection_uri')
      .eq('profile_id', userId)
      .eq('is_active', true)
      .not('nwc_connection_uri', 'is', null)
      .order('is_primary', { ascending: false })
      .limit(1);

    if (!senderWallets || senderWallets.length === 0 || !senderWallets[0].nwc_connection_uri) {
      return { success: false, error: 'No Lightning wallet (NWC) connected. Add one in Settings → Wallet to enable automatic payments.' };
    }

    let senderNwcUri: string;
    try {
      senderNwcUri = decrypt(senderWallets[0].nwc_connection_uri);
    } catch {
      return { success: false, error: 'Wallet connection is corrupted. Please reconnect your wallet in Settings.' };
    }

    // 2. Resolve recipient's lightning address
    const trimmedRecipient = recipient.trim();
    let lightningAddress: string;

    if (trimmedRecipient.includes('@') && !trimmedRecipient.startsWith('@')) {
      // Direct lightning address: alice@getalby.com
      lightningAddress = trimmedRecipient;
    } else {
      // Username lookup: @alice or alice
      const username = trimmedRecipient.startsWith('@') ? trimmedRecipient.slice(1) : trimmedRecipient;
      const admin = getAdminClient() as unknown as SupabaseClient;

      const { data: profile } = await admin
        .from(DATABASE_TABLES.PROFILES)
        .select('id')
        .eq('username', username)
        .single();

      if (!profile) {
        return { success: false, error: `User @${username} not found` };
      }

      const { data: recipientWallets } = await admin
        .from(DATABASE_TABLES.WALLETS)
        .select('lightning_address')
        .eq('profile_id', profile.id)
        .eq('is_active', true)
        .not('lightning_address', 'is', null)
        .order('is_primary', { ascending: false })
        .limit(1);

      if (!recipientWallets || recipientWallets.length === 0 || !recipientWallets[0].lightning_address) {
        return { success: false, error: `@${username} has no Lightning address configured. Ask them to add one in their settings.` };
      }

      lightningAddress = recipientWallets[0].lightning_address;
    }

    // 3. Generate invoice from recipient's lightning address
    const recipientWallet: ResolvedWallet = {
      method: 'lightning_address',
      wallet_id: 'recipient',
      lightning_address: lightningAddress,
    };

    let invoice;
    try {
      invoice = await generateInvoice(recipientWallet, amountBtc, memo);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: `Could not reach ${lightningAddress}: ${msg}` };
    }

    if (!invoice.bolt11) {
      return { success: false, error: 'Failed to get a Lightning invoice from the recipient' };
    }

    // 4. Pay invoice from sender's NWC wallet
    const sendNwcClient = new NWCClient(senderNwcUri);
    try {
      await sendNwcClient.connect();
      const payResult = await sendNwcClient.payInvoice(invoice.bolt11);
      const displayMemo = memo !== 'Payment via My Cat' ? ` — "${memo}"` : '';
      return {
        success: true,
        data: {
          payment_hash: payResult.payment_hash,
          amount_btc: amountBtc,
          recipient: lightningAddress,
          memo,
          status: 'paid',
          displayMessage: `Sent ${amountBtc} BTC to ${lightningAddress}${displayMemo}`,
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: `Lightning payment failed: ${msg}. Check your wallet has sufficient balance.` };
    } finally {
      sendNwcClient.disconnect();
    }
  },

  fund_project: async (supabase, userId, _actorId, params) => {
    const projectId = params.project_id as string;
    const amountBtc = params.amount_btc as number;
    const message = (params.message as string | undefined) || null;

    if (!amountBtc || amountBtc <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // 1. Get sender's NWC wallet
    const { data: senderWallets } = await supabase
      .from(DATABASE_TABLES.WALLETS)
      .select('nwc_connection_uri')
      .eq('profile_id', userId)
      .eq('is_active', true)
      .not('nwc_connection_uri', 'is', null)
      .order('is_primary', { ascending: false })
      .limit(1);

    if (!senderWallets || senderWallets.length === 0 || !senderWallets[0].nwc_connection_uri) {
      return { success: false, error: 'No Lightning wallet (NWC) connected. Add one in Settings → Wallet to fund projects automatically.' };
    }

    let senderNwcUri: string;
    try {
      senderNwcUri = decrypt(senderWallets[0].nwc_connection_uri);
    } catch {
      return { success: false, error: 'Wallet connection is corrupted. Please reconnect your wallet in Settings.' };
    }

    // 2. Resolve project owner's payment method (uses admin internally for cross-user lookup)
    const projectWallet = await resolveSellerWallet(
      supabase as unknown as SupabaseClient,
      'project',
      projectId
    );

    if (!projectWallet) {
      return { success: false, error: 'This project has no payment method configured. The project creator needs to add a wallet first.' };
    }

    if (projectWallet.method === 'onchain') {
      return { success: false, error: 'This project only accepts on-chain Bitcoin. Use the Fund button on the project page to get the payment address.' };
    }

    // 3. Fetch project title for invoice description
    const admin = getAdminClient() as unknown as SupabaseClient;
    const { data: project } = await admin
      .from(ENTITY_REGISTRY.project.tableName)
      .select('title')
      .eq('id', projectId)
      .single();

    const description = `Project: ${project?.title ?? projectId}`;

    // 4. Generate invoice from project owner's wallet
    let invoice;
    try {
      invoice = await generateInvoice(projectWallet, amountBtc, description);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: `Could not generate invoice for this project: ${msg}` };
    }

    if (!invoice.bolt11) {
      return { success: false, error: 'Failed to generate a Lightning invoice for this project' };
    }

    // 5. Pay invoice from sender's NWC wallet
    const fundNwcClient = new NWCClient(senderNwcUri);
    try {
      await fundNwcClient.connect();
      const payResult = await fundNwcClient.payInvoice(invoice.bolt11);

      // 6. Resolve seller user_id for DB record
      const sellerId = await getSellerUserId(
        supabase as unknown as SupabaseClient,
        'project',
        projectId
      );

      // 7. Record payment intent as paid
      const { data: pi } = await supabase
        .from(DATABASE_TABLES.PAYMENT_INTENTS)
        .insert({
          buyer_id: userId,
          seller_id: sellerId ?? userId,
          entity_type: 'project',
          entity_id: projectId,
          amount_btc: amountBtc,
          payment_method: projectWallet.method,
          bolt11: invoice.bolt11,
          payment_hash: payResult.payment_hash ?? null,
          onchain_address: null,
          status: 'paid',
          description,
          paid_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      // 8. Record contribution (fire-and-forget; payment is already confirmed)
      if (pi) {
        await supabase
          .from(DATABASE_TABLES.CONTRIBUTIONS)
          .insert({
            payment_intent_id: pi.id,
            contributor_id: userId,
            entity_type: 'project',
            entity_id: projectId,
            amount_btc: amountBtc,
            message: message ?? null,
            is_anonymous: false,
          });
      }

      const projectTitle = project?.title ?? 'the project';
      return {
        success: true,
        data: {
          payment_hash: payResult.payment_hash,
          amount_btc: amountBtc,
          project_id: projectId,
          project_title: projectTitle,
          message,
          status: 'paid',
          displayMessage: `Funded "${projectTitle}" with ${amountBtc} BTC via Lightning!${message ? ` Message: "${message}"` : ''}`,
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: `Lightning payment failed: ${msg}. Check your wallet has sufficient balance.` };
    } finally {
      fundNwcClient.disconnect();
    }
  },
};
