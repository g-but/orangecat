import { BitcoinTransaction, BitcoinWalletData } from '@/types/bitcoin';

// API configuration with different providers for fallback
const API_PROVIDERS = [
  {
    name: 'mempool.space',
    baseUrl: 'https://mempool.space/api',
    addressEndpoint: (address: string) => `/address/${address}`,
    txsEndpoint: (address: string) => `/address/${address}/txs`,
    processBalance: (data: any) => (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000,
    processTransactions: (data: any, address: string) => 
      data.slice(0, 5).map((tx: any) => {
        let type: 'incoming' | 'outgoing' = 'incoming';
        let value = 0;
        
        for (const input of tx.vin) {
          if (input.prevout && input.prevout.scriptpubkey_address === address) {
            type = 'outgoing';
            break;
          }
        }
        
        for (const output of tx.vout) {
          if (output.scriptpubkey_address === address) {
            value += output.value;
          }
        }
        
        return {
          txid: tx.txid,
          value: value / 100000000, // Convert satoshis to BTC
          status: tx.status.confirmed ? 'confirmed' : 'pending',
          timestamp: tx.status.block_time ? tx.status.block_time * 1000 : Date.now(),
          type
        };
      })
  },
  {
    name: 'blockstream.info',
    baseUrl: 'https://blockstream.info/api',
    addressEndpoint: (address: string) => `/address/${address}`,
    txsEndpoint: (address: string) => `/address/${address}/txs`,
    processBalance: (data: any) => (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000,
    processTransactions: (data: any, address: string) => 
      data.slice(0, 5).map((tx: any) => {
        // Similar processing as above, adapted for blockstream API
        let type: 'incoming' | 'outgoing' = 'incoming';
        let value = 0;
        
        for (const input of tx.vin) {
          if (input.prevout && input.prevout.scriptpubkey_address === address) {
            type = 'outgoing';
            break;
          }
        }
        
        for (const output of tx.vout) {
          if (output.scriptpubkey_address === address) {
            value += output.value;
          }
        }
        
        return {
          txid: tx.txid,
          value: value / 100000000,
          status: tx.status.confirmed ? 'confirmed' : 'pending',
          timestamp: tx.status.block_time ? tx.status.block_time * 1000 : Date.now(),
          type
        };
      })
  }
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
  
  for (const provider of API_PROVIDERS) {
    try {
      // Fetch address data
      const addressUrl = `${provider.baseUrl}${provider.addressEndpoint(cleanAddress)}`;
      const addressResponse = await fetch(addressUrl);
      
      if (!addressResponse.ok) {
        console.warn(`Failed to fetch from ${provider.name}, trying next provider...`);
        continue;
      }
      
      const addressData = await addressResponse.json();
      const balance = provider.processBalance(addressData);
      
      // Fetch transaction data
      const txsUrl = `${provider.baseUrl}${provider.txsEndpoint(cleanAddress)}`;
      const txsResponse = await fetch(txsUrl);
      
      if (!txsResponse.ok) {
        console.warn(`Failed to fetch transactions from ${provider.name}, trying next provider...`);
        continue;
      }
      
      const txsData = await txsResponse.json();
      const transactions = provider.processTransactions(txsData, cleanAddress);
      
      return {
        balance,
        transactions,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error(`Error with provider ${provider.name}:`, error);
      // Continue to next provider
    }
  }
  
  // If all providers fail
  throw new Error('Failed to fetch wallet data from any provider');
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
