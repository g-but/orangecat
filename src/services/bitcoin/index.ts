import { BitcoinTransaction, BitcoinWalletData } from '@/types/bitcoin/index';

const API_TIMEOUT_MS = 10000; // 10 seconds timeout for API calls

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(id);
  return response;
}

// API configuration with different providers for fallback
const API_PROVIDERS = [
  {
    name: 'mempool.space',
    baseUrl: 'https://mempool.space/api',
    addressEndpoint: (address: string) => `/address/${address}`,
    txsEndpoint: (address: string) => `/address/${address}/txs`,
    processBalance: (data: any) => (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum), // Keep in Satoshis for now, convert later
    processTransactions: (data: any[], address: string): BitcoinTransaction[] =>
      data.slice(0, 10).map((tx: any): BitcoinTransaction => {
        let txType: 'incoming' | 'outgoing' = 'incoming';
        let valueInSatoshis = 0;

        const inputsFromAddress = tx.vin.filter((input: any) => input.prevout && input.prevout.scriptpubkey_address === address);
        const outputsToAddress = tx.vout.filter((output: any) => output.scriptpubkey_address === address);

        if (inputsFromAddress.length > 0) {
          txType = 'outgoing';
          // For an outgoing tx, value is total spent from address MINUS change received back to address
          const totalSpentFromAddress = inputsFromAddress.reduce((sum: number, input: any) => sum + input.prevout.value, 0);
          const changeToAddress = outputsToAddress.reduce((sum: number, output: any) => sum + output.value, 0);
          valueInSatoshis = totalSpentFromAddress - changeToAddress;
          
          // A simpler approach for outgoing might be sum of outputs NOT to address
          // This requires iterating all vout and summing those where scriptpubkey_address !== address
          // However, the above (total spent - change) is also a valid perspective for "net amount sent"
          // Let's refine if this still feels off, but it's better than current.
          // If inputsFromAddress > 0 but all outputs are also to the address (self-spend consolidation), value can be 0.
          // For a true send, some outputs must go to other addresses.
          // Let's consider the "net amount that left the wallet"
          let amountSentToOthers = 0;
          for (const output of tx.vout) {
            if (output.scriptpubkey_address !== address) {
              amountSentToOthers += output.value;
            }
          }
          if (amountSentToOthers > 0) {
            valueInSatoshis = amountSentToOthers;
          } else {
            // If no amount sent to others (e.g. consolidation), value is effectively 0 from "sent" perspective
            // but we can show the total input value as "moved" or "processed"
             valueInSatoshis = totalSpentFromAddress; // Or perhaps 0 for "sent to others"
          }


        } else if (outputsToAddress.length > 0) {
          txType = 'incoming';
          valueInSatoshis = outputsToAddress.reduce((sum: number, output: any) => sum + output.value, 0);
        } else {
          // Edge case: transaction involves the address but not in a typical in/out way (e.g., complex script, or not our UTXOs)
          // Or, it's a transaction NOT involving this address at all if API returns such things (unlikely for address-specific endpoints)
          // For now, let's default to 0 value and potentially 'unknown' type if we had one.
          valueInSatoshis = 0; 
        }
        
        // If it's an outgoing transaction and valueInSatoshis is 0 due to only change outputs,
        // it might be a consolidation. Let's ensure we show the actual amount moved if that's the case.
        if (txType === 'outgoing' && valueInSatoshis === 0 && inputsFromAddress.length > 0) {
             const totalValueFromInputs = inputsFromAddress.reduce((sum: number, input: any) => sum + input.prevout.value, 0);
             // If all outputs go back to the same address, it's a self-spend.
             const allOutputsToSelf = tx.vout.every((output: any) => output.scriptpubkey_address === address);
             if (allOutputsToSelf) {
                 // For self-spends (consolidation), value displayed could be the total input value,
                 // indicating funds were "processed" or "managed".
                 // Or, one could argue the "net change in external balance" is 0.
                 // For user display, showing the amount that moved is likely more intuitive.
                 valueInSatoshis = totalValueFromInputs;
             }
             // if valueInSatoshis is still 0 here, it means it was an outgoing tx but no value sent to others,
             // and it wasn't a simple consolidation that we could identify with totalInputValue.
        }


        return {
          txid: tx.txid,
          value: valueInSatoshis / 100000000, // Convert satoshis to BTC
          status: tx.status.confirmed ? 'confirmed' : 'pending',
          timestamp: tx.status.block_time ? tx.status.block_time * 1000 : Date.now(),
          type: txType,
        };
      }),
  },
  {
    name: 'blockstream.info', // Assuming similar structure for Blockstream
    baseUrl: 'https://blockstream.info/api',
    addressEndpoint: (address: string) => `/address/${address}`,
    txsEndpoint: (address: string) => `/address/${address}/txs`,
    processBalance: (data: any) => (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum), // Keep in Satoshis
    processTransactions: (data: any[], address: string): BitcoinTransaction[] =>
      data.slice(0, 10).map((tx: any): BitcoinTransaction => {
        // --- REPLICATE THE IMPROVED LOGIC FROM MEMPOOL.SPACE ABOVE ---
        let txType: 'incoming' | 'outgoing' = 'incoming';
        let valueInSatoshis = 0;

        const inputsFromAddress = tx.vin.filter((input: any) => input.prevout && input.prevout.scriptpubkey_address === address);
        const outputsToAddress = tx.vout.filter((output: any) => output.scriptpubkey_address === address);

        if (inputsFromAddress.length > 0) {
          txType = 'outgoing';
          let amountSentToOthers = 0;
          for (const output of tx.vout) {
            if (output.scriptpubkey_address !== address) {
              amountSentToOthers += output.value;
            }
          }
          if (amountSentToOthers > 0) {
            valueInSatoshis = amountSentToOthers;
          } else { // handles consolidation where no value sent to others
            const totalValueFromInputs = inputsFromAddress.reduce((sum: number, input: any) => sum + input.prevout.value, 0);
            valueInSatoshis = totalValueFromInputs; // Show total moved value for consolidations
          }
        } else if (outputsToAddress.length > 0) {
          txType = 'incoming';
          valueInSatoshis = outputsToAddress.reduce((sum: number, output: any) => sum + output.value, 0);
        } else {
          valueInSatoshis = 0;
        }

        return {
          txid: tx.txid,
          value: valueInSatoshis / 100000000, // Convert satoshis to BTC
          status: tx.status.confirmed ? 'confirmed' : 'pending',
          timestamp: tx.status.block_time ? tx.status.block_time * 1000 : Date.now(),
          type: txType,
        };
      }),
  },
];

// Clean Bitcoin address from URI if needed
export const cleanBitcoinAddress = (address: string): string => {
  return address.startsWith('bitcoin:') 
    ? address.split('?')[0].replace('bitcoin:', '')
    : address;
};

// Fetch wallet data with failover between different providers
export const fetchBitcoinWalletData = async (address: string): Promise<BitcoinWalletData> => {
  const cleanAddress = cleanBitcoinAddress(address);
  let lastError: Error | null = null;
  
  for (const provider of API_PROVIDERS) {
    try {
      const addressUrl = `${provider.baseUrl}${provider.addressEndpoint(cleanAddress)}`;
      const addressResponse = await fetchWithTimeout(addressUrl, API_TIMEOUT_MS);
      
      if (!addressResponse.ok) {
        const errorText = await addressResponse.text();
        console.warn(`API Error from ${provider.name} (Address - ${addressResponse.status}): ${errorText}`);
        lastError = new Error(`Provider ${provider.name} address fetch failed: ${addressResponse.status}`);
        continue;
      }
      
      const addressData = await addressResponse.json();
      const balanceInSatoshis = provider.processBalance(addressData); // This is now in Satoshis
      
      const txsUrl = `${provider.baseUrl}${provider.txsEndpoint(cleanAddress)}`;
      const txsResponse = await fetchWithTimeout(txsUrl, API_TIMEOUT_MS);
      
      if (!txsResponse.ok) {
        const errorText = await txsResponse.text();
        console.warn(`API Error from ${provider.name} (Transactions - ${txsResponse.status}): ${errorText}`);
        lastError = new Error(`Provider ${provider.name} transactions fetch failed: ${txsResponse.status}`);
        continue;
      }
      
      const txsData = await txsResponse.json();
      const transactions = provider.processTransactions(txsData, cleanAddress);
      
      return {
        balance: balanceInSatoshis / 100000000, // Convert balance to BTC here
        transactions,
        lastUpdated: Date.now()
      };
    } catch (error: any) {
      console.error(`Error with provider ${provider.name}:`, error.message);
      lastError = error;
      // Continue to next provider
    }
  }
  
  console.error(`Failed to fetch wallet data for ${cleanAddress} from all providers. Last error:`, lastError);
  throw lastError || new Error('Failed to fetch wallet data from any provider for address: ' + cleanAddress);
};

// Format BTC value for display
export const formatBtcValue = (satoshis: number): string => {
  const btc = satoshis / 100000000;
  return btc.toLocaleString('en-US', {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8
  });
};

// Get mempool.space transaction URL
export const getTransactionUrl = (txid: string): string => {
  return `https://mempool.space/tx/${txid}`;
};

// Get mempool.space address URL
export const getAddressUrl = (address: string): string => {
  return `https://mempool.space/address/${cleanBitcoinAddress(address)}`;
};
