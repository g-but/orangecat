'use client';

/**
 * DEMO CIRCLES TAB
 *
 * Shows community circles with shared wallets and governance.
 */

import { Users, Wallet, PiggyBank, Target } from 'lucide-react';
import { type DemoCircle, formatSats, getRoleBadgeColor } from '@/data/demo';

interface DemoCirclesProps {
  circles: DemoCircle[];
  selectedCircle: DemoCircle;
  onCircleSelect: (circle: DemoCircle) => void;
}

export function DemoCircles({ circles, selectedCircle, onCircleSelect }: DemoCirclesProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Circles</h2>
          <p className="text-gray-600">Communities with shared wallets and goals</p>
        </div>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700 transition-colors">
          <Users className="w-4 h-4" />
          Create Circle
        </button>
      </div>

      {/* Circle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {circles.map(circle => (
          <CircleCard
            key={circle.id}
            circle={circle}
            isSelected={selectedCircle.id === circle.id}
            onSelect={() => onCircleSelect(circle)}
          />
        ))}
      </div>

      {/* Selected Circle Details */}
      <CircleDetails circle={selectedCircle} />
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

interface CircleCardProps {
  circle: DemoCircle;
  isSelected: boolean;
  onSelect: () => void;
}

function CircleCard({ circle, isSelected, onSelect }: CircleCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`bg-white rounded-lg border-2 p-4 md:p-6 text-left transition-all w-full ${
        isSelected ? 'border-orange-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{circle.avatar}</span>
          <div>
            <h3 className="font-semibold">{circle.name}</h3>
            <p className="text-xs text-gray-600">{circle.category}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs ${getRoleBadgeColor(circle.userRole)}`}>
          {circle.userRole}
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{circle.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-lg font-semibold">{circle.memberCount}</p>
          <p className="text-xs text-gray-600">Members</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">{formatSats(circle.totalBalance)}</p>
          <p className="text-xs text-gray-600">Balance</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-500 truncate">Recent: {circle.recentActivity}</p>
        <div className="flex gap-1 flex-wrap">
          {circle.wallets.slice(0, 2).map((wallet, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
              {wallet.name}
            </span>
          ))}
          {circle.wallets.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
              +{circle.wallets.length - 2} more
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

interface CircleDetailsProps {
  circle: DemoCircle;
}

function CircleDetails({ circle }: CircleDetailsProps) {
  return (
    <div className="bg-white rounded-lg border p-4 md:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-3xl">{circle.avatar}</span>
          <div>
            <h3 className="text-xl font-bold">{circle.name}</h3>
            <p className="text-gray-600">{circle.description}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Manage Wallets</span>
          </button>
          <button className="flex-1 md:flex-none px-4 py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Manage Members</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{circle.memberCount}</p>
          <p className="text-sm text-gray-600">Active Members</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <PiggyBank className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{formatSats(circle.totalBalance)}</p>
          <p className="text-sm text-gray-600">Total Balance</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{circle.projects}</p>
          <p className="text-sm text-gray-600">Active Projects</p>
        </div>
      </div>
    </div>
  );
}
