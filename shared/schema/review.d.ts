export interface Review {
    id: string;
    userId: string;
    entityType: string;
    entityId: string;
    /** Directory profile ID of the organiser/venue being reviewed */
    organizerId: string;
    /** Event that the review is associated with (proof of attendance context) */
    eventId: string;
    /** Ticket ID — proof that the reviewer attended the event */
    ticketId: string;
    rating: number;
    comment?: string;
    status: 'pending' | 'approved' | 'rejected';
    helpfulCount: number;
    createdAt: string;
    updatedAt?: string;
}
//# sourceMappingURL=review.d.ts.map