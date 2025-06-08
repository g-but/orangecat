/**
 * CampaignCard Component Tests
 * 
 * Testing critical fundraising display component for the Bitcoin platform
 * Handles financial data, progress tracking, and campaign management actions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CampaignCard from '../CampaignCard';
import { CampaignData } from '@/data/dashboardConfigs';

// Mock the icons
jest.mock('lucide-react', () => ({
  Handshake: ({ className }: any) => <div data-testid="handshake-icon" className={className} />,
  Users: ({ className }: any) => <div data-testid="users-icon" className={className} />,
  Target: ({ className }: any) => <div data-testid="target-icon" className={className} />,
  Settings: ({ className }: any) => <div data-testid="settings-icon" className={className} />,
  BarChart3: ({ className }: any) => <div data-testid="barchart-icon" className={className} />
}));

// Mock the ComingSoonModal
jest.mock('@/components/ui/ComingSoonModal', () => {
  return function MockComingSoonModal({ isOpen, onClose, featureName, timeline, learnMoreUrl }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="coming-soon-modal">
        <div>Feature: {featureName}</div>
        <div>Timeline: {timeline}</div>
        <div>Learn More: {learnMoreUrl}</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

describe('💳 CampaignCard Component - Bitcoin Fundraising Display', () => {
  // Test data for different campaign scenarios
  const activeCampaign: CampaignData = {
    id: 1,
    title: 'Bitcoin Education Initiative',
    type: 'Education',
    status: 'Active',
    raised: 150000,
    goal: 250000,
    supporters: 42,
    daysLeft: 15,
    progress: 60,
    color: 'bg-blue-100 text-blue-700'
  };

  const completedCampaign: CampaignData = {
    id: 2,
    title: 'Lightning Network Workshop',
    type: 'Technology',
    status: 'Completed',
    raised: 100000,
    goal: 100000,
    supporters: 28,
    daysLeft: 0,
    progress: 100,
    color: 'bg-green-100 text-green-700'
  };

  const draftCampaign: CampaignData = {
    id: 3,
    title: 'Bitcoin Community Meetup',
    type: 'Community',
    status: 'Draft',
    raised: 0,
    goal: 50000,
    supporters: 0,
    daysLeft: 30,
    progress: 0,
    color: 'bg-purple-100 text-purple-700'
  };

  describe('✅ Basic Campaign Information Display', () => {
    test('should render campaign title correctly', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      expect(screen.getByText('Bitcoin Education Initiative')).toBeInTheDocument();
    });

    test('should display campaign type with correct styling', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      const typeElement = screen.getByText('Education');
      expect(typeElement).toBeInTheDocument();
      expect(typeElement).toHaveClass('bg-blue-100', 'text-blue-700');
    });

    test('should show handshake icon for campaigns', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      expect(screen.getByTestId('handshake-icon')).toBeInTheDocument();
    });

    test('should display campaign status with correct color coding', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      const statusElement = screen.getByText('Active');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass('bg-green-100', 'text-green-700');
    });
  });

  describe('💰 Financial Data Display - Critical for Bitcoin Platform', () => {
    test('should display raised amount in sats with proper formatting', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      expect(screen.getByText("150,000 sats")).toBeInTheDocument();
    });

    test('should display goal amount in sats with proper formatting', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      expect(screen.getByText("250,000 sats")).toBeInTheDocument();
    });

    test('should handle large amounts with proper locale formatting', () => {
      const largeCampaign = { ...activeCampaign, raised: 1500000, goal: 2000000 };
      render(<CampaignCard campaign={largeCampaign} />);
      expect(screen.getByText("1,500,000 sats")).toBeInTheDocument();
      expect(screen.getByText("2,000,000 sats")).toBeInTheDocument();
    });

    test('should display zero amounts correctly', () => {
      render(<CampaignCard campaign={draftCampaign} />);
      expect(screen.getByText('0 sats')).toBeInTheDocument();
    });

    test('should show supporters count', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    test('should handle zero supporters', () => {
      render(<CampaignCard campaign={draftCampaign} />);
      const supportersValue = screen.getAllByText('0').find(el => 
        el.closest('div')?.textContent?.includes('Supporters')
      );
      expect(supportersValue).toBeInTheDocument();
    });
  });

  describe('📊 Progress Tracking - Campaign Success Metrics', () => {
    test('should display progress percentage', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    test('should render progress bar with correct width', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      const progressBar = document.querySelector('.bg-teal-600');
      expect(progressBar).toHaveStyle({ width: '60%' });
    });

    test('should handle 100% completion', () => {
      render(<CampaignCard campaign={completedCampaign} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
      const progressBar = document.querySelector('.bg-teal-600');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    test('should handle 0% progress', () => {
      render(<CampaignCard campaign={draftCampaign} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
      const progressBar = document.querySelector('.bg-teal-600');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    test('should show days left for active campaigns', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    test('should show "Completed" for finished campaigns', () => {
      render(<CampaignCard campaign={completedCampaign} />);
      const statusElements = screen.getAllByText('Completed');
      expect(statusElements).toHaveLength(2); // Should appear in both status badge and days left
    });
  });

  describe('🎨 Status Color Coding - UX Enhancement', () => {
    test('should apply correct styling for Active status', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      const statusElement = screen.getByText('Active');
      expect(statusElement).toHaveClass('bg-green-100', 'text-green-700');
    });

    test('should apply correct styling for Completed status', () => {
      render(<CampaignCard campaign={completedCampaign} />);
      const statusElements = screen.getAllByText('Completed');
      const statusElement = statusElements.find(el => el.className.includes('px-2 py-1'));
      expect(statusElement).toHaveClass('bg-blue-100', 'text-blue-700');
    });

    test('should apply correct styling for Draft status', () => {
      render(<CampaignCard campaign={draftCampaign} />);
      const statusElement = screen.getByText('Draft');
      expect(statusElement).toHaveClass('bg-gray-100', 'text-gray-700');
    });
  });

  describe('🔄 Interactive Elements - Campaign Management', () => {
    test('should render Analytics button with icon', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByTestId('barchart-icon')).toBeInTheDocument();
    });

    test('should render Manage button with icon', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      expect(screen.getByText('Manage')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    test('should open modal when Analytics button is clicked', async () => {
      render(<CampaignCard campaign={activeCampaign} />);
      
      const analyticsButton = screen.getByText('Analytics');
      fireEvent.click(analyticsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('coming-soon-modal')).toBeInTheDocument();
        expect(screen.getByText('Feature: Advanced Fundraising')).toBeInTheDocument();
        expect(screen.getByText('Timeline: Q1 2025')).toBeInTheDocument();
        expect(screen.getByText('Learn More: /fundraising')).toBeInTheDocument();
      });
    });

    test('should open modal when Manage button is clicked', async () => {
      render(<CampaignCard campaign={activeCampaign} />);
      
      const manageButton = screen.getByText('Manage');
      fireEvent.click(manageButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('coming-soon-modal')).toBeInTheDocument();
      });
    });

    test('should close modal when close button is clicked', async () => {
      render(<CampaignCard campaign={activeCampaign} />);
      
      fireEvent.click(screen.getByText('Analytics'));
      
      await waitFor(() => {
        expect(screen.getByTestId('coming-soon-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Close'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('coming-soon-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('🎨 Visual Design & Animations', () => {
    test('should have hover shadow effect', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      const card = document.querySelector('.hover\\:shadow-md');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('transition-shadow');
    });

    test('should have gradient background for icon', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      const iconContainer = document.querySelector('.bg-gradient-to-r');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('from-teal-100', 'to-cyan-100');
    });

    test('should have progress bar animation classes', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      const progressBar = document.querySelector('.bg-teal-600');
      expect(progressBar).toHaveClass('transition-all', 'duration-300');
    });
  });

  describe('♿ Accessibility & Semantic Structure', () => {
    test('should have proper heading structure', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Bitcoin Education Initiative');
    });

    test('should have accessible button labels', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      expect(screen.getByRole('button', { name: /Analytics/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Manage/ })).toBeInTheDocument();
    });

    test('should use semantic elements for data display', () => {
      render(<CampaignCard campaign={activeCampaign} />);
      
      // Check that financial data is properly structured
      expect(screen.getByText('Raised')).toBeInTheDocument();
      expect(screen.getByText('Goal')).toBeInTheDocument();
      expect(screen.getByText('Supporters')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });
  });

  describe('💼 Real-world Campaign Scenarios', () => {
    test('should handle new campaign (just started)', () => {
      const newCampaign = { ...activeCampaign, raised: 1000, progress: 1, supporters: 1 };
      render(<CampaignCard campaign={newCampaign} />);
      
      expect(screen.getByText("1,000 sats")).toBeInTheDocument();
      expect(screen.getByText('1%')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('should handle nearly completed campaign', () => {
      const nearlyComplete = { ...activeCampaign, raised: 245000, progress: 98, daysLeft: 1 };
      render(<CampaignCard campaign={nearlyComplete} />);
      
      expect(screen.getByText('245,000 sats')).toBeInTheDocument();
      expect(screen.getByText('98%')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('should handle overfunded campaign', () => {
      const overfunded = { ...activeCampaign, raised: 300000, progress: 120 };
      render(<CampaignCard campaign={overfunded} />);
      
      expect(screen.getByText('300,000 sats')).toBeInTheDocument();
      expect(screen.getByText('120%')).toBeInTheDocument();
    });

    test('should handle long campaign titles', () => {
      const longTitle = { 
        ...activeCampaign, 
        title: 'Very Long Campaign Title That Should Still Display Properly In The Card Layout' 
      };
      render(<CampaignCard campaign={longTitle} />);
      
      expect(screen.getByText('Very Long Campaign Title That Should Still Display Properly In The Card Layout')).toBeInTheDocument();
    });

    test('should handle different campaign types', () => {
      const techCampaign = { ...activeCampaign, type: 'Technology', color: 'bg-purple-100 text-purple-700' };
      render(<CampaignCard campaign={techCampaign} />);
      
      const typeElement = screen.getByText('Technology');
      expect(typeElement).toHaveClass('bg-purple-100', 'text-purple-700');
    });
  });

  describe('🔧 Error Handling & Edge Cases', () => {
    test('should handle missing or undefined progress', () => {
      const noProg = { ...activeCampaign, progress: undefined as any };
      render(<CampaignCard campaign={noProg} />);
      
      // Should not crash and show 0% or handle gracefully
      const progressBar = document.querySelector('.bg-teal-600');
      expect(progressBar).toBeInTheDocument();
    });

    test('should handle negative days left', () => {
      const overdue = { ...activeCampaign, daysLeft: -5 };
      render(<CampaignCard campaign={overdue} />);
      
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    test('should handle very large numbers', () => {
      const hugeCampaign = { 
        ...activeCampaign, 
        raised: 999999999, 
        goal: 1000000000,
        supporters: 10000 
      };
      render(<CampaignCard campaign={hugeCampaign} />);
      
      expect(screen.getByText('999,999,999 sats')).toBeInTheDocument();
      expect(screen.getByText('1,000,000,000 sats')).toBeInTheDocument();
      expect(screen.getByText('10,000')).toBeInTheDocument();
    });
  });
}); 