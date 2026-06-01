export interface Waitlist {
    id: string;
    eventId: string;
    userId: string;
    position: number;
    notified: boolean;
    createdAt: string;
    notificationPreference: 'push' | 'email' | 'both';
    /** ISO timestamp — 48 h window to claim a released spot before it passes to the next person */
    expiresAt?: string;
    /** ISO timestamp — set when the user purchases their released ticket */
    claimedAt?: string;
}
//# sourceMappingURL=waitlist.d.ts.map