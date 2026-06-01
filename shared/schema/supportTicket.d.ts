export type SupportTicketDepartment = 'support' | 'legal' | 'privacy' | 'bugs';
export type SupportTicketStatus = 'new' | 'in_progress' | 'waiting_on_user' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export interface SupportTicketStatusHistoryItem {
    status: SupportTicketStatus;
    at: string;
    by: string;
    note?: string;
}
export interface SupportTicketInternalNote {
    id: string;
    text: string;
    by: string;
    byName?: string;
    createdAt: string;
}
export interface SupportTicket {
    id: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    userRole?: string;
    department: SupportTicketDepartment;
    toEmail: string;
    subject: string;
    message: string;
    appVersion?: string;
    platform?: string;
    source?: string;
    status: SupportTicketStatus;
    priority: SupportTicketPriority;
    statusHistory: SupportTicketStatusHistoryItem[];
    assigneeId?: string | null;
    assigneeName?: string | null;
    firstResponseAt?: string;
    replySentAt?: string;
    replySentBy?: string;
    dueAt?: string;
    internalNotes: SupportTicketInternalNote[];
    resolvedAt?: string;
    resolvedBy?: string;
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=supportTicket.d.ts.map