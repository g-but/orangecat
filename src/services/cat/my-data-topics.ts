/**
 * SSOT for the query_my_data topic list — split from my-data.ts so the tool
 * definition (tool-use-detection.ts) can enumerate topics without importing
 * the query implementation and its database dependencies.
 */
export const MY_DATA_TOPICS = [
  'listings',
  'earnings',
  'bookings',
  'wallets',
  'notifications',
  'tasks',
  'overview',
] as const;
export type MyDataTopic = (typeof MY_DATA_TOPICS)[number];
