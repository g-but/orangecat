'use client';

/**
 * DEMO CLIENT COMPONENT
 *
 * Main client component for the interactive demo.
 * Handles state management and renders tab content.
 */

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, DollarSign, MessageCircle, Target, Home, Play, Pause } from 'lucide-react';

import {
  DEMO_USER,
  DEMO_CIRCLES,
  DEMO_LOANS,
  DEMO_AVAILABLE_LOANS,
  DEMO_TIMELINE,
  DEMO_PROJECTS,
  DEMO_STEPS,
  type DemoCircle,
} from '@/data/demo';

import { DemoDashboard } from './tabs/DemoDashboard';
import { DemoCircles } from './tabs/DemoCircles';
import { DemoLoans } from './tabs/DemoLoans';
import { DemoTimeline } from './tabs/DemoTimeline';
import { DemoProjects } from './tabs/DemoProjects';

// ==================== TYPES ====================

type TabId = 'dashboard' | 'circles' | 'loans' | 'timeline' | 'projects';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Home;
}

// ==================== CONSTANTS ====================

const TABS: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'circles', label: 'My Circles', icon: Users },
  { id: 'loans', label: 'My Loans', icon: DollarSign },
  { id: 'timeline', label: 'Timeline', icon: MessageCircle },
  { id: 'projects', label: 'Projects', icon: Target },
];

// ==================== ANIMATION VARIANTS ====================

const tabContentVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const stepInfoVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

// ==================== MAIN COMPONENT ====================

export function DemoClient() {
  // State
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedCircle, setSelectedCircle] = useState<DemoCircle>(DEMO_CIRCLES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Handlers
  const handleNextStep = useCallback(() => {
    if (currentStep < DEMO_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      const highlight = DEMO_STEPS[nextStep].highlight;
      if (highlight) {
        setActiveTab(highlight as TabId);
      }
    }
  }, [currentStep]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      const highlight = DEMO_STEPS[prevStep].highlight;
      if (highlight) {
        setActiveTab(highlight as TabId);
      }
    }
  }, [currentStep]);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  const handleCircleSelect = useCallback((circle: DemoCircle) => {
    setSelectedCircle(circle);
  }, []);

  // Memoized current step data
  const currentStepData = useMemo(() => DEMO_STEPS[currentStep], [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <DemoHeader user={DEMO_USER} />

      {/* Demo Controls */}
      <DemoControls
        currentStep={currentStep}
        totalSteps={DEMO_STEPS.length}
        isPlaying={isPlaying}
        onPrevStep={handlePrevStep}
        onNextStep={handleNextStep}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
      />

      {/* Step Info Banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={stepInfoVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="bg-blue-600 text-white px-4 py-2"
        >
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{currentStepData.title}</h3>
                <p className="text-sm opacity-90">{currentStepData.content}</p>
              </div>
              <div className="text-sm opacity-75">
                Step {currentStep + 1} of {DEMO_STEPS.length}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Tab Navigation */}
      <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {activeTab === 'dashboard' && (
              <DemoDashboard user={DEMO_USER} timeline={DEMO_TIMELINE} projects={DEMO_PROJECTS} />
            )}
            {activeTab === 'circles' && (
              <DemoCircles
                circles={DEMO_CIRCLES}
                selectedCircle={selectedCircle}
                onCircleSelect={handleCircleSelect}
              />
            )}
            {activeTab === 'loans' && (
              <DemoLoans loans={DEMO_LOANS} availableLoans={DEMO_AVAILABLE_LOANS} />
            )}
            {activeTab === 'timeline' && <DemoTimeline timeline={DEMO_TIMELINE} />}
            {activeTab === 'projects' && <DemoProjects projects={DEMO_PROJECTS} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <DemoFooter />
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

interface DemoHeaderProps {
  user: typeof DEMO_USER;
}

function DemoHeader({ user }: DemoHeaderProps) {
  return (
    <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🟠</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">OrangeCat 3.0</h1>
              <p className="text-sm text-gray-600">Bitcoin Crowdfunding • Community • Finance</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-gray-500">@{user.username}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg">
              {user.avatar}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DemoControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
  onTogglePlay: () => void;
}

function DemoControls({
  currentStep,
  totalSteps,
  isPlaying,
  onPrevStep,
  onNextStep,
  onTogglePlay,
}: DemoControlsProps) {
  return (
    <div className="border-b bg-gray-50 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">Interactive Demo</div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevStep}
              disabled={currentStep === 0}
              className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
              aria-label="Previous step"
            >
              Previous
            </button>
            <span className="text-xs text-gray-600">
              {currentStep + 1} of {totalSteps}
            </span>
            <button
              onClick={onNextStep}
              disabled={currentStep === totalSteps - 1}
              className="px-3 py-1 text-xs bg-white border rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
              aria-label="Next step"
            >
              Next
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded flex items-center gap-1 hover:bg-blue-700 transition-colors"
            aria-label={isPlaying ? 'Pause auto play' : 'Start auto play'}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isPlaying ? 'Pause' : 'Auto Play'}
          </button>
          <Link
            href="/"
            className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            View Live Site
          </Link>
        </div>
      </div>
    </div>
  );
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex gap-4 sm:gap-8 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
                aria-selected={isActive}
                role="tab"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DemoFooter() {
  return (
    <div className="border-t bg-white mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Ready to Join OrangeCat?</h3>
          <p className="text-gray-600 mb-6">
            Experience the future of Bitcoin crowdfunding, community building, and peer-to-peer
            finance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth?mode=register"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/"
              className="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



