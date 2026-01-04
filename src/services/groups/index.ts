/**
 * Groups Service - Main Orchestrator
 *
 * Unified service for groups.
 * Re-exports all functionality from modular sub-modules.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-12-29
 * Last Modified Summary: Simplified to use only new groups system
 */

// Re-export types
export * from './types';

// Re-export constants
export * from './constants';

// Re-export queries
export * from './queries/groups';
export * from './queries/members';
export * from './queries/wallets';
export * from './queries/activities';
export * from './queries/invitations';
export * from './queries/events';
export * from './queries/proposals';

// Re-export mutations
export * from './mutations/groups';
export * from './mutations/members';
export * from './mutations/wallets';
export * from './mutations/invitations';
export * from './mutations/events';

// Re-export permissions
export * from './permissions';

// Re-export validation
export * from './validation';

// Re-export utils
export * from './utils/helpers';
export * from './utils/activity';

/**
 * GroupsService Class
 *
 * Provides a class-based interface for groups operations.
 * Internally uses the modular functions.
 */
class GroupsService {
  // Group management
  async createGroup(input: Parameters<typeof import('./mutations/groups').createGroup>[0]) {
    return import('./mutations/groups').then((m) => m.createGroup(input));
  }

  async getGroup(identifier: string, bySlug: boolean = false) {
    return import('./queries/groups').then((m) => m.getGroup(identifier, bySlug));
  }

  async updateGroup(
    groupId: string,
    input: Parameters<typeof import('./mutations/groups').updateGroup>[1]
  ) {
    return import('./mutations/groups').then((m) => m.updateGroup(groupId, input));
  }

  async deleteGroup(groupId: string) {
    return import('./mutations/groups').then((m) => m.deleteGroup(groupId));
  }

  async getUserGroups(
    query?: Parameters<typeof import('./queries/groups').getUserGroups>[0],
    pagination?: Parameters<typeof import('./queries/groups').getUserGroups>[1]
  ) {
    return import('./queries/groups').then((m) => m.getUserGroups(query, pagination));
  }

  async getAvailableGroups(
    query?: Parameters<typeof import('./queries/groups').getAvailableGroups>[0],
    pagination?: Parameters<typeof import('./queries/groups').getAvailableGroups>[1]
  ) {
    return import('./queries/groups').then((m) => m.getAvailableGroups(query, pagination));
  }

  async searchGroups(
    searchQuery: string,
    filters?: Parameters<typeof import('./queries/groups').searchGroups>[1],
    pagination?: Parameters<typeof import('./queries/groups').searchGroups>[2]
  ) {
    return import('./queries/groups').then((m) => m.searchGroups(searchQuery, filters, pagination));
  }

  // Member management
  async joinGroup(groupId: string) {
    return import('./mutations/members').then((m) => m.joinGroup(groupId));
  }

  async leaveGroup(groupId: string) {
    return import('./mutations/members').then((m) => m.leaveGroup(groupId));
  }

  async getGroupMembers(groupId: string, pagination?: { page?: number; pageSize?: number }) {
    return import('./queries/members').then((m) => m.getGroupMembers(groupId, pagination));
  }

  async addMember(
    groupId: string,
    input: Parameters<typeof import('./mutations/members').addMember>[1]
  ) {
    return import('./mutations/members').then((m) => m.addMember(groupId, input));
  }

  async updateMember(
    groupId: string,
    memberId: string,
    input: Parameters<typeof import('./mutations/members').updateMember>[2]
  ) {
    return import('./mutations/members').then((m) => m.updateMember(groupId, memberId, input));
  }

  async removeMember(groupId: string, memberId: string) {
    return import('./mutations/members').then((m) => m.removeMember(groupId, memberId));
  }

  // Wallet management
  async getGroupWallets(groupId: string) {
    return import('./queries/wallets').then((m) => m.getGroupWallets(groupId));
  }

  async createGroupWallet(
    request: Parameters<typeof import('./mutations/wallets').createGroupWallet>[0]
  ) {
    return import('./mutations/wallets').then((m) => m.createGroupWallet(request));
  }

  async updateGroupWallet(
    walletId: string,
    request: Parameters<typeof import('./mutations/wallets').updateGroupWallet>[1]
  ) {
    return import('./mutations/wallets').then((m) => m.updateGroupWallet(walletId, request));
  }

  // Activity tracking
  async getGroupActivities(
    groupId: string,
    query?: Parameters<typeof import('./queries/activities').getGroupActivities>[1],
    pagination?: Parameters<typeof import('./queries/activities').getGroupActivities>[2]
  ) {
    return import('./queries/activities').then((m) =>
      m.getGroupActivities(groupId, query, pagination)
    );
  }

  // Invitation management
  async createInvitation(
    input: Parameters<typeof import('./mutations/invitations').createInvitation>[0]
  ) {
    return import('./mutations/invitations').then((m) => m.createInvitation(input));
  }

  async acceptInvitation(invitationId: string) {
    return import('./mutations/invitations').then((m) => m.acceptInvitation(invitationId));
  }

  async declineInvitation(invitationId: string) {
    return import('./mutations/invitations').then((m) => m.declineInvitation(invitationId));
  }

  async acceptInvitationByToken(token: string) {
    return import('./mutations/invitations').then((m) => m.acceptInvitationByToken(token));
  }

  async revokeInvitation(invitationId: string) {
    return import('./mutations/invitations').then((m) => m.revokeInvitation(invitationId));
  }

  async getUserPendingInvitations() {
    return import('./queries/invitations').then((m) => m.getUserPendingInvitations());
  }

  async getUserInvitationCount() {
    return import('./queries/invitations').then((m) => m.getUserInvitationCount());
  }

  async getGroupInvitations(
    groupId: string,
    options?: Parameters<typeof import('./queries/invitations').getGroupInvitations>[1]
  ) {
    return import('./queries/invitations').then((m) => m.getGroupInvitations(groupId, options));
  }

  async getInvitationByToken(token: string) {
    return import('./queries/invitations').then((m) => m.getInvitationByToken(token));
  }

  // Event management
  async createEvent(
    input: Parameters<typeof import('./mutations/events').createEvent>[0]
  ) {
    return import('./mutations/events').then((m) => m.createEvent(input));
  }

  async updateEvent(
    eventId: string,
    input: Parameters<typeof import('./mutations/events').updateEvent>[1]
  ) {
    return import('./mutations/events').then((m) => m.updateEvent(eventId, input));
  }

  async deleteEvent(eventId: string) {
    return import('./mutations/events').then((m) => m.deleteEvent(eventId));
  }

  async rsvpToEvent(
    eventId: string,
    status: Parameters<typeof import('./mutations/events').rsvpToEvent>[1]
  ) {
    return import('./mutations/events').then((m) => m.rsvpToEvent(eventId, status));
  }

  async getGroupEvents(
    groupId: string,
    options?: Parameters<typeof import('./queries/events').getGroupEvents>[1]
  ) {
    return import('./queries/events').then((m) => m.getGroupEvents(groupId, options));
  }

  async getEvent(eventId: string) {
    return import('./queries/events').then((m) => m.getEvent(eventId));
  }

  async getEventRsvps(eventId: string) {
    return import('./queries/events').then((m) => m.getEventRsvps(eventId));
  }

  async getUpcomingEvents(groupId: string, limit?: number) {
    return import('./queries/events').then((m) => m.getUpcomingEvents(groupId, limit));
  }

  async getUserRsvpStatus(eventId: string) {
    return import('./queries/events').then((m) => m.getUserRsvpStatus(eventId));
  }

  // Permissions
  async checkGroupPermission(
    groupId: string,
    userId: string,
    permission: Parameters<typeof import('./permissions').checkGroupPermission>[2]
  ) {
    return import('./permissions').then((m) =>
      m.checkGroupPermission(groupId, userId, permission)
    );
  }

  async getGroupPermissions(groupId: string, userId: string) {
    return import('./permissions').then((m) => m.getGroupPermissions(groupId, userId));
  }
}

// Export singleton instance
const groupsService = new GroupsService();
export default groupsService;

// Export class for testing
export { GroupsService };
