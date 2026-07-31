/**
 * Article route skeleton — immediate paint while the article streams in.
 * Without this the post-publish navigation showed a blank page for the full
 * fetch duration (observed ~4s on prod).
 */
export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-surface-page pt-20 pb-24">
      <div className="mx-auto w-full max-w-[720px] animate-pulse px-5">
        <div className="mb-8 h-4 w-28 rounded bg-surface-raised" />
        <div className="space-y-3">
          <div className="h-9 w-4/5 rounded bg-surface-raised" />
          <div className="h-9 w-3/5 rounded bg-surface-raised" />
        </div>
        <div className="mt-6 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-surface-raised" />
          <div className="space-y-2">
            <div className="h-3 w-32 rounded bg-surface-raised" />
            <div className="h-3 w-24 rounded bg-surface-raised" />
          </div>
        </div>
        <div className="mt-10 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-full rounded bg-surface-raised" />
              <div className="h-4 w-11/12 rounded bg-surface-raised" />
              <div className="h-4 w-4/6 rounded bg-surface-raised" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
