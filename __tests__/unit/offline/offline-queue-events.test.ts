/** @jest-environment jsdom */
import { queueUpdated, syncStart, syncProgress, syncComplete, offlineQueueEvents } from '@/lib/offline-queue-events'

describe('offline-queue-events', () => {
  test('dispatches updated event (including legacy)', () => {
    const updatedSpy = jest.fn()
    const legacySpy = jest.fn()
    window.addEventListener(offlineQueueEvents.UPDATED, updatedSpy as EventListener)
    window.addEventListener('offline-queue-updated', legacySpy as EventListener)

    queueUpdated()

    expect(updatedSpy).toHaveBeenCalled()
    expect(legacySpy).toHaveBeenCalled()

    window.removeEventListener(offlineQueueEvents.UPDATED, updatedSpy as EventListener)
    window.removeEventListener('offline-queue-updated', legacySpy as EventListener)
  })

  test('dispatches sync lifecycle events with detail', () => {
    const startSpy = jest.fn()
    const progressSpy = jest.fn()
    const completeSpy = jest.fn()

    window.addEventListener(offlineQueueEvents.SYNC_START, startSpy as EventListener)
    window.addEventListener(offlineQueueEvents.SYNC_PROGRESS, progressSpy as EventListener)
    window.addEventListener(offlineQueueEvents.SYNC_COMPLETE, completeSpy as EventListener)

    syncStart(3)
    syncProgress(1, 3)
    syncProgress(3, 3)
    syncComplete()

    expect(startSpy).toHaveBeenCalled()
    expect((startSpy.mock.calls[0][0] as CustomEvent).detail.total).toBe(3)
    expect(progressSpy).toHaveBeenCalled()
    const progressEvent = progressSpy.mock.calls[0][0] as CustomEvent
    expect(progressEvent.detail.processed).toBe(1)
    expect(progressEvent.detail.total).toBe(3)
    expect(completeSpy).toHaveBeenCalled()

    window.removeEventListener(offlineQueueEvents.SYNC_START, startSpy as EventListener)
    window.removeEventListener(offlineQueueEvents.SYNC_PROGRESS, progressSpy as EventListener)
    window.removeEventListener(offlineQueueEvents.SYNC_COMPLETE, completeSpy as EventListener)
  })
})

