/**
 * A repost is shown as the post it is; a quote repost shows two posts.
 *
 * A simple repost used to suppress its own content and render the original
 * inside a bordered panel instead — a panel repeating the original author's
 * avatar and handle, which the post header directly above was ALREADY showing
 * (PostCard swaps the reposter for the original author on a simple repost).
 * One repost drew the same person twice, two lines apart, with the actual text
 * boxed off underneath.
 *
 * The distinction these tests hold: a SIMPLE repost has one author and one
 * body, so it renders flat. A QUOTE repost genuinely has two of each, so it
 * keeps the nested panel. Collapsing both cases the same way would be the
 * opposite bug.
 */

import { render, screen } from '@testing-library/react';
import { PostContent } from '@/components/timeline/PostContent';
import type { TimelineDisplayEvent } from '@/types/timeline';

jest.mock('@/utils/markdown', () => ({
  renderMarkdownToReact: (text: string) => text,
}));

const base = {
  id: 'e1',
  actor: { id: 'a1', name: 'Reposter', username: 'reposter', type: 'user' },
  description: '',
  metadata: {},
} as unknown as TimelineDisplayEvent;

function simpleRepost(): TimelineDisplayEvent {
  return {
    ...base,
    description: '',
    metadata: {
      is_repost: true,
      original_event_id: 'orig-1',
      original_actor_name: 'Original Author',
      original_actor_username: 'original',
      original_description: 'The original words.',
    },
  } as unknown as TimelineDisplayEvent;
}

function quoteRepost(): TimelineDisplayEvent {
  return {
    ...base,
    description: 'My take on this.',
    metadata: {
      is_repost: true,
      is_quote_repost: true,
      original_event_id: 'orig-1',
      original_actor_name: 'Original Author',
      original_actor_username: 'original',
      original_description: 'The original words.',
    },
  } as unknown as TimelineDisplayEvent;
}

describe('a simple repost', () => {
  it('shows the original text as the post body', () => {
    render(<PostContent event={simpleRepost()} />);

    expect(screen.getByText('The original words.')).toBeInTheDocument();
  });

  it('does not repeat the original author, who is already in the header', () => {
    render(<PostContent event={simpleRepost()} />);

    // PostCard renders the original author in the post header for a simple
    // repost. PostContent must not draw them a second time.
    expect(screen.queryByText('Original Author')).not.toBeInTheDocument();
    expect(screen.queryByText('@original')).not.toBeInTheDocument();
  });
});

describe('a quote repost', () => {
  it('shows the quoter’s own words as the post body', () => {
    render(<PostContent event={quoteRepost()} />);

    expect(screen.getByText('My take on this.')).toBeInTheDocument();
  });

  it('keeps the quoted original in its own panel, author and all', () => {
    render(<PostContent event={quoteRepost()} />);

    // Two posts, two authors: here the panel earns its place.
    expect(screen.getByText('Original Author')).toBeInTheDocument();
    expect(screen.getByText('The original words.')).toBeInTheDocument();
  });
});
