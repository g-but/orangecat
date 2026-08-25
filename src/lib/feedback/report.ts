/**
 * One way to file a bug from inside the product.
 *
 * OrangeCat embeds FleetCrown's feedback widget (see src/app/layout.tsx), which
 * publishes `window.FleetCrown.report()` — it opens the feedback panel with the
 * failure already described and machine-readable context attached, so reporting
 * a bug is one click instead of "notice the floating button, open it, re-type
 * what the product already knew".
 *
 * Everything that wants to offer "report this" goes through here, so the
 * fallback behaviour is decided once: `widget.js` is loaded async and gated by
 * a server-side kill switch, so it may legitimately be absent. Callers get a
 * boolean and render a plain link to the feedback page when it is.
 */

/** Flat context; rendered as `key: value` lines into the report body. */
export type ReportDiagnostics = Record<string, string | number | boolean | null | undefined>;

interface FleetCrownApi {
  report(input: { message?: string; diagnostics?: ReportDiagnostics }): void;
}

declare global {
  interface Window {
    FleetCrown?: FleetCrownApi;
  }
}

/**
 * Open the feedback panel pre-filled. Returns false when the widget is not
 * available, so the caller can fall back to a static link instead of rendering
 * a button that does nothing.
 */
export function reportToFleetCrown(input: {
  message: string;
  diagnostics?: ReportDiagnostics;
}): boolean {
  if (typeof window === 'undefined' || typeof window.FleetCrown?.report !== 'function') {
    return false;
  }
  window.FleetCrown.report(input);
  return true;
}

/** True when a "Report" control will actually do something on this page. */
export function canReportInPlace(): boolean {
  return typeof window !== 'undefined' && typeof window.FleetCrown?.report === 'function';
}
