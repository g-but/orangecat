/** @jest-environment jsdom */
import { syncManager } from '@/lib/sync-manager'
import { offlineQueueEvents } from '@/lib/offline-queue-events'

jest.mock('@/services/timeline', () => ({
  timelineService: {
    createEvent: jest.fn().mockResolvedValue({ success: true })
  }
}))

const queueMock = {
  getQueueByUser: jest.fn(),
  removeFromQueue: jest.fn().mockResolvedValue(undefined),
  incrementAttemptCount: jest.fn().mockResolvedValue(undefined)
}

jest.mock('@/lib/offline-queue', () => ({
  offlineQueueService: queueMock
}))

describe('sync-manager', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    ;(navigator as any).onLine = true
    queueMock.getQueueByUser.mockReset()
    queueMock.removeFromQueue.mockReset()
    queueMock.incrementAttemptCount.mockReset()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test('emits lifecycle events and processes queue', async () => {
    const startSpy = jest.fn()
    const progressSpy = jest.fn()
    const completeSpy = jest.fn()
    window.addEventListener(offlineQueueEvents.SYNC_START, startSpy as EventListener)
    window.addEventListener(offlineQueueEvents.SYNC_PROGRESS, progressSpy as EventListener)
    window.addEventListener(offlineQueueEvents.SYNC_COMPLETE, completeSpy as EventListener)

    queueMock.getQueueByUser.mockResolvedValue([
      { id: 'q1', payload: { a: 1 }, attempts: 0 },
      { id: 'q2', payload: { a: 2 }, attempts: 0 }
    ])

    syncManager.setCurrentUser('user-1')
    await syncManager.processQueue()

    expect(startSpy).toHaveBeenCalled()
    expect(progressSpy).toHaveBeenCalled()
    expect(completeSpy).toHaveBeenCalled()
    expect(queueMock.removeFromQueue).toHaveBeenCalledTimes(2)

    window.removeEventListener(offlineQueueEvents.SYNC_START, startSpy as EventListener)
    window.removeEventListener(offlineQueueEvents.SYNC_PROGRESS, progressSpy as EventListener)
    window.removeEventListener(offlineQueueEvents.SYNC_COMPLETE, completeSpy as EventListener)
  })

  test('classifies 4xx as permanent and removes item', async () => {
    const { timelineService } = jest.requireMock('@/services/timeline')
    ;(timelineService.createEvent as jest.Mock).mockResolvedValue({ success: false, error: { status: 403 } })

    queueMock.getQueueByUser.mockResolvedValue([{ id: 'q3', payload: {}, attempts: 0 }])
    syncManager.setCurrentUser('user-2')
    await syncManager.processQueue()

    expect(queueMock.removeFromQueue).toHaveBeenCalledWith('q3')
    expect(queueMock.incrementAttemptCount).not.toHaveBeenCalled()
  })

  test('classifies network/5xx as transient and increments attempts', async () => {
    const { timelineService } = jest.requireMock('@/services/timeline')
    ;(timelineService.createEvent as jest.Mock).mockRejectedValue({ status: 500 })

    queueMock.getQueueByUser.mockResolvedValue([{ id: 'q4', payload: {}, attempts: 1 }])
    syncManager.setCurrentUser('user-3')
    await syncManager.processQueue()

    expect(queueMock.incrementAttemptCount).toHaveBeenCalledWith('q4')
  })
})

