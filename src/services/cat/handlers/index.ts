import { entityHandlers } from './entities';
import { communicationHandlers } from './communication';
import { organizationHandlers } from './organization';
import { contextHandlers } from './context';
import { productivityHandlers } from './productivity';
import { paymentHandlers } from './payments';
import { socialHandlers } from './social';
import { interestHandlers } from './interests';
import type { ActionHandler } from './types';

export const ACTION_HANDLERS: Partial<Record<string, ActionHandler>> = {
  ...socialHandlers,
  ...interestHandlers,
  ...entityHandlers,
  ...communicationHandlers,
  ...organizationHandlers,
  ...contextHandlers,
  ...productivityHandlers,
  ...paymentHandlers,
};

export type { ActionHandler };
export { parseReminderDate } from './date-utils';
