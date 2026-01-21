/**
 * My Cat Services
 *
 * Central export for all My Cat related services.
 *
 * Created: 2026-01-21
 * Last Modified: 2026-01-21
 * Last Modified Summary: Initial implementation
 */

export { CatPermissionService, createPermissionService } from './permission-service';
export type { CatPermission, PermissionCheck, UserPermissionSummary } from './permission-service';

export { CatActionExecutor, createActionExecutor } from './action-executor';
export type { ActionRequest, ActionResult, PendingAction } from './action-executor';
