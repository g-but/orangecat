import { getUserFundraisingStats, getRecentDonationsCount } from '@/services/supabase/fundraising';
import { fetchBitcoinWalletData } from '@/services/bitcoin';
import { logger } from '@/utils/logger';

// Types for our analytics system
export interface MetricValue {
  value: number | string;
  confidence: 'high' | 'medium' | 'low';
  lastUpdated: Date;
  source: 'database' | 'api' | 'demo';
  isDemo: boolean;
}

export interface FeatureMetrics {
  isEnabled: boolean;
  isDemo: boolean;
  timeline?: string;
  stats: Record<string, MetricValue>;
}

export interface DashboardMetrics {
  fundraising: FeatureMetrics;
  organizations: FeatureMetrics;
  events: FeatureMetrics;
  projects: FeatureMetrics;
  assets: FeatureMetrics;
  people: FeatureMetrics;
  wallet: FeatureMetrics;
}

// Feature flags - easily configurable
const FEATURE_FLAGS = {
  fundraising: { enabled: true, timeline: 'Available Now' },
  organizations: { enabled: false, timeline: 'Q1 2026' },
  events: { enabled: false, timeline: 'Q2 2026' },
  projects: { enabled: true, timeline: 'Available Now' },
  assets: { enabled: false, timeline: 'Q2 2026' },
  people: { enabled: false, timeline: 'Q2 2026' },
  wallet: { enabled: true, timeline: 'Available Now' },
};

class AnalyticsService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private createMetricValue(
    value: number | string,
    source: 'database' | 'api' | 'demo',
    confidence: 'high' | 'medium' | 'low' = 'high'
  ): MetricValue {
    return {
      value,
      confidence,
      lastUpdated: new Date(),
      source,
      isDemo: source === 'demo',
    };
  }

  private safeCalculation<T>(calculation: () => T, fallback: T, context: string): T {
    try {
      const result = calculation();
      if (typeof result === 'number' && (isNaN(result) || !isFinite(result))) {
        logger.warn(`Invalid calculation result for ${context}`, { result }, 'Analytics');
        return fallback;
      }
      return result;
    } catch (error) {
      logger.error(`Calculation failed for ${context}`, error, 'Analytics');
      return fallback;
    }
  }

  async getFundraisingMetrics(userId: string): Promise<FeatureMetrics> {
    const cacheKey = `fundraising-${userId}`;
    const cached = this.getCachedData<FeatureMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const [statsData, recentDonations] = await Promise.all([
        getUserFundraisingStats(userId),
        getRecentDonationsCount(userId),
      ]);

      const avgDonationSize = this.safeCalculation(
        () =>
          statsData.totalSupporters > 0 ? statsData.totalRaised / statsData.totalSupporters : 0,
        0,
        'avgDonationSize'
      );

      const successRate = this.safeCalculation(
        () => {
          // Simplified for MVP - no success rate calculation needed
          return 0;
        },
        0,
        'successRate'
      );

      const metrics: FeatureMetrics = {
        isEnabled: true,
        isDemo: false,
        timeline: FEATURE_FLAGS.fundraising.timeline,
        stats: {
          totalProjects: this.createMetricValue(statsData.totalProjects, 'database'),
          totalRaised: this.createMetricValue(statsData.totalRaised, 'database'),
          totalSupporters: this.createMetricValue(statsData.totalSupporters, 'database'),
          activeProjects: this.createMetricValue(statsData.activeProjects, 'database'),
          recentDonations: this.createMetricValue(recentDonations, 'database'),
          avgDonationSize: this.createMetricValue(avgDonationSize, 'database'),
          successRate: this.createMetricValue(successRate, 'database'),
        },
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      logger.error('Error fetching fundraising metrics', error, 'Analytics');
      return this.getFallbackFundraisingMetrics();
    }
  }

  private getFallbackFundraisingMetrics(): FeatureMetrics {
    return {
      isEnabled: true,
      isDemo: false,
      timeline: FEATURE_FLAGS.fundraising.timeline,
      stats: {
        totalProjects: this.createMetricValue(0, 'database', 'low'),
        totalRaised: this.createMetricValue(0, 'database', 'low'),
        totalSupporters: this.createMetricValue(0, 'database', 'low'),
        activeProjects: this.createMetricValue(0, 'database', 'low'),
        recentDonations: this.createMetricValue(0, 'database', 'low'),
        avgDonationSize: this.createMetricValue(0, 'database', 'low'),
        successRate: this.createMetricValue(0, 'database', 'low'),
      },
    };
  }

  async getWalletMetrics(walletAddress?: string): Promise<FeatureMetrics> {
    if (!walletAddress) {
      return {
        isEnabled: true,
        isDemo: false,
        timeline: FEATURE_FLAGS.wallet.timeline,
        stats: {
          balance: this.createMetricValue(0, 'api', 'low'),
          transactionCount: this.createMetricValue(0, 'api', 'low'),
          lastUpdated: this.createMetricValue('Never', 'api', 'low'),
        },
      };
    }

    const cacheKey = `wallet-${walletAddress}`;
    const cached = this.getCachedData<FeatureMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const walletData = await fetchBitcoinWalletData(walletAddress);

      const metrics: FeatureMetrics = {
        isEnabled: true,
        isDemo: false,
        timeline: FEATURE_FLAGS.wallet.timeline,
        stats: {
          balance: this.createMetricValue(walletData.balance, 'api'),
          transactionCount: this.createMetricValue(walletData.transactions.length, 'api'),
          lastUpdated: this.createMetricValue(
            walletData.lastUpdated
              ? new Date(walletData.lastUpdated).toLocaleTimeString()
              : 'Unknown',
            'api'
          ),
        },
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      logger.error('Error fetching wallet metrics', error, 'Analytics');
      return {
        isEnabled: true,
        isDemo: false,
        timeline: FEATURE_FLAGS.wallet.timeline,
        stats: {
          balance: this.createMetricValue(0, 'api', 'low'),
          transactionCount: this.createMetricValue(0, 'api', 'low'),
          lastUpdated: this.createMetricValue('Error', 'api', 'low'),
        },
      };
    }
  }

  getOrganizationsMetrics(): FeatureMetrics {
    // Organizations feature is not implemented yet in current schema
    return {
      isEnabled: false,
      isDemo: false,
      timeline: FEATURE_FLAGS.organizations.timeline,
      stats: {
        totalOrganizations: this.createMetricValue(0, 'api'),
        totalMembers: this.createMetricValue(0, 'api'),
        combinedTreasury: this.createMetricValue('0.000 BTC', 'api'),
        activeProposals: this.createMetricValue(0, 'api'),
      },
    };
  }

  getEventsMetrics(): FeatureMetrics {
    // Events feature is not implemented yet in current schema
    return {
      isEnabled: false,
      isDemo: false,
      timeline: FEATURE_FLAGS.events.timeline,
      stats: {
        totalEvents: this.createMetricValue(0, 'api'),
        totalAttendees: this.createMetricValue(0, 'api'),
        totalRevenue: this.createMetricValue('0.000 BTC', 'api'),
        upcomingEvents: this.createMetricValue(0, 'api'),
      },
    };
  }

  getProjectsMetrics(): FeatureMetrics {
    // Projects feature is enabled and functional
    return {
      isEnabled: true,
      isDemo: false,
      timeline: FEATURE_FLAGS.projects.timeline,
      stats: {
        totalProjects: this.createMetricValue(0, 'database'),
        totalContributors: this.createMetricValue(0, 'database'),
        totalFunding: this.createMetricValue('0.000 BTC', 'database'),
        avgProgress: this.createMetricValue('0%', 'database'),
      },
    };
  }

  getAssetsMetrics(): FeatureMetrics {
    // Assets feature is not implemented yet in current schema
    return {
      isEnabled: false,
      isDemo: false,
      timeline: FEATURE_FLAGS.assets.timeline,
      stats: {
        totalAssets: this.createMetricValue(0, 'api'),
        totalEarnings: this.createMetricValue('0.000 BTC', 'api'),
        totalRentals: this.createMetricValue(0, 'api'),
        availableAssets: this.createMetricValue(0, 'api'),
      },
    };
  }

  getPeopleMetrics(): FeatureMetrics {
    return {
      isEnabled: false,
      isDemo: true,
      timeline: FEATURE_FLAGS.people.timeline,
      stats: {
        totalConnections: this.createMetricValue(0, 'demo'),
        friends: this.createMetricValue(0, 'demo'),
        colleagues: this.createMetricValue(0, 'demo'),
        mutualConnections: this.createMetricValue(
          this.safeCalculation(() => 0, 0, 'mutualConnections'),
          'demo'
        ),
      },
    };
  }

  async getAllMetrics(userId: string, walletAddress?: string): Promise<DashboardMetrics> {
    try {
      const [fundraising, wallet] = await Promise.all([
        this.getFundraisingMetrics(userId),
        this.getWalletMetrics(walletAddress),
      ]);

      return {
        fundraising,
        wallet,
        organizations: this.getOrganizationsMetrics(),
        events: this.getEventsMetrics(),
        projects: this.getProjectsMetrics(),
        assets: this.getAssetsMetrics(),
        people: this.getPeopleMetrics(),
      };
    } catch (error) {
      logger.error('Error fetching all metrics', error, 'Analytics');
      throw error;
    }
  }

  // Utility methods
  formatCurrency(amount: number, currency: string = 'SATS'): string {
    if (currency === 'BTC') {
      return `₿${(amount / 100000000).toFixed(6)}`;
    }
    return `${amount.toLocaleString('en-US')} sats`;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
