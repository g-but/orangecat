import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ReadableStream as NodeReadableStream } from 'stream/web'
import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'util'
import { CatChatPanel } from '@/components/ai-chat/CatChatPanel'

// Polyfills for node test environment
// @ts-ignore
global.TextDecoder = NodeTextDecoder as unknown as typeof global.TextDecoder
// @ts-ignore
global.TextEncoder = NodeTextEncoder as unknown as typeof global.TextEncoder
// JSDOM doesn't implement scrollIntoView
// @ts-ignore
if (!HTMLElement.prototype.scrollIntoView) {
  // @ts-ignore
  HTMLElement.prototype.scrollIntoView = () => {}
}

function makeSSEBody(chunks: string[]): NodeReadableStream<Uint8Array> {
  let i = 0
  return new NodeReadableStream<Uint8Array>({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(new TextEncoder().encode(chunks[i++]))
      } else {
        controller.close()
      }
    },
  })
}

// Skipped by default due to complex UI deps; enable locally when module aliases are configured for tests.
// Minimal UI mocks to allow rendering CatChatPanel
jest.mock('lucide-react', () => new Proxy({}, { get: () => () => null }))
jest.mock('@/components/ui/Button', () => ({ __esModule: true, default: (props: any) => <button {...props} /> }))
jest.mock('@/components/ui/Input', () => ({ __esModule: true, Input: (props: any) => <input {...props} /> }))
jest.mock('@/components/ui/badge', () => ({ __esModule: true, Badge: (props: any) => <span {...props} /> }))
jest.mock('@/components/ui/avatar', () => ({ __esModule: true, Avatar: (p:any)=> <div {...p} />, AvatarImage: (p:any)=> <img alt="" {...p} />, AvatarFallback: (p:any)=> <div {...p} /> }))
jest.mock('@/components/ai-chat/ModelSelector', () => ({ __esModule: true, ModelSelector: () => null, ModelBadge: () => null }))

describe('CatChatPanel streaming (remote)', () => {
  beforeEach(() => {
    jest.spyOn(global as any, 'fetch').mockImplementation((input: any) => {
      if (typeof input === 'string' && input.includes('/api/cat/chat')) {
        const body = makeSSEBody([
          'data: {"content":"Hello"}\n\n',
          'data: {"content":" world"}\n\n',
          'data: {"done":true}\n\n',
        ]) as unknown as ReadableStream
        return Promise.resolve({ ok: true, body } as unknown as Response)
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response)
    })
  })

  afterEach(() => {
    ;(global.fetch as jest.Mock).mockRestore()
  })

  it('renders streamed assistant content incrementally', async () => {
    render(<CatChatPanel />)

    const input = screen.getByPlaceholderText(/ask your cat/i)
    fireEvent.change(input, { target: { value: 'Test prompt' } })

    const send = screen.getByRole('button', { name: /send/i })
    await act(async () => {
      fireEvent.click(send)
    })

    // Combined content after second chunk (streamed)
    expect(await screen.findByText('Hello world')).toBeInTheDocument()
  })
})
