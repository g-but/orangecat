/**
 * TESLA-GRADE DRAFT DASHBOARD
 * Beautiful real-time interface with advanced features
 */

'use client'

import React from 'react'
import { useTeslaDrafts } from '@/hooks/useTeslaDrafts'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  Plus, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Wifi, 
  WifiOff,
  Zap,
  BarChart3,
  FileText,
  Trash2,
  Copy,
  Share2,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react'
import { DraftStatus } from '@/services/drafts/types'

interface TeslaDraftDashboardProps {
  className?: string
}

export default function TeslaDraftDashboard({ className = '' }: TeslaDraftDashboardProps) {
  const {
    drafts,
    activeDraft,
    isLoading,
    isCreating,
    isSyncing,
    hasConflicts,
    error,
    stats,
    createDraft,
    setActiveDraft,
    syncDraft,
    deleteDraft,
    duplicateDraft,
    refreshDrafts
  } = useTeslaDrafts()

  const handleCreateDraft = async () => {
    try {
      await createDraft({
        title: 'New Campaign Draft'
      })
    } catch (error) {
      console.error('Failed to create draft:', error)
    }
  }

  const getStatusIndicator = (status: DraftStatus) => {
    switch (status) {
      case DraftStatus.SYNCED:
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case DraftStatus.SYNCING:
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case DraftStatus.CONFLICT:
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case DraftStatus.OFFLINE:
        return <WifiOff className="w-4 h-4 text-gray-400" />
      case DraftStatus.ERROR:
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (status: DraftStatus) => {
    switch (status) {
      case DraftStatus.SYNCED:
        return 'Synced'
      case DraftStatus.SYNCING:
        return 'Syncing...'
      case DraftStatus.CONFLICT:
        return 'Needs review'
      case DraftStatus.OFFLINE:
        return 'Offline'
      case DraftStatus.ERROR:
        return 'Error'
      default:
        return 'Creating...'
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 animate-pulse ${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-xl"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Error Banner */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Drafts</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalDrafts}</p>
              </div>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Completion</p>
                <p className="text-2xl font-bold text-green-900">{stats.averageCompletion}%</p>
              </div>
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Word Count</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalWordCount.toLocaleString()}</p>
              </div>
              <Edit3 className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Synced</p>
                <p className="text-2xl font-bold text-amber-900">
                  {stats.syncedDrafts}/{stats.totalDrafts}
                </p>
              </div>
              <Wifi className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">Campaign Drafts</h2>
          {hasConflicts && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
              <AlertTriangle className="w-4 h-4" />
              {stats.conflictedDrafts} conflicts
            </div>
          )}
          {isSyncing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Syncing...
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDrafts}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            onClick={handleCreateDraft}
            disabled={isCreating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating...' : 'New Draft'}
          </Button>
        </div>
      </div>

      {/* Drafts Grid */}
      {stats.totalDrafts > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft) => (
            <Card 
              key={draft.id}
              className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${
                activeDraft?.id === draft.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              } ${
                draft.conflicts.length > 0 
                  ? 'border-amber-200 bg-amber-50' 
                  : 'border-gray-200'
              }`}
              onClick={() => setActiveDraft(draft.id)}
            >
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{draft.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIndicator(draft.status)}
                      <span className="text-sm text-gray-500">
                        {getStatusText(draft.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicateDraft(draft.id)
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteDraft(draft.id)
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Completion</span>
                    <span>{Math.round(draft.metadata.completionPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${draft.metadata.completionPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="block text-xs text-gray-500">Step</span>
                    <span className="font-medium">{draft.currentStep}/5</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Words</span>
                    <span className="font-medium">{draft.metadata.wordCount}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs text-gray-500">Last modified</span>
                    <span className="font-medium">{formatTimeAgo(draft.lastModifiedAt)}</span>
                  </div>
                </div>

                {/* Conflicts Alert */}
                {draft.conflicts.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-100 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {draft.conflicts.length} conflict{draft.conflicts.length !== 1 ? 's' : ''} need review
                      </span>
                    </div>
                  </div>
                )}

                {/* Device Info */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{draft.metadata.deviceType} • {draft.metadata.browser.split(' ')[0]}</span>
                    <span>v{draft.version}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No drafts yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Create your first campaign draft with our intelligent real-time editor
            </p>
            <Button
              onClick={handleCreateDraft}
              disabled={isCreating}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create First Draft'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 