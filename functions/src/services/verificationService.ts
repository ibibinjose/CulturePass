/**
 * Verification Service
 *
 * Business logic for admin verification workflow for profiles requiring
 * legal/regulatory validation.
 *
 * Related: .kiro/specs/hostspace-enterprise-forms/requirements.md (Requirement 8)
 */

import { db } from '../admin';
import type {
  VerificationTask,
  VerificationChecklistItem,
  CreateVerificationTask,
} from '../../../shared/schema/hostVerificationTask';
import type { HostProfile, HostEntityType } from '../../../shared/schema/hostProfile';

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

const verificationTasksCol = () => db.collection('hostVerificationTasks');
const profilesCol = () => db.collection('hostProfiles');

// ---------------------------------------------------------------------------
// Verification Service
// ---------------------------------------------------------------------------

export const verificationService = {
  /**
   * Check if a profile requires verification based on entity type and data
   */
  requiresVerification(profile: HostProfile): boolean {
    // Business profiles with ABN/ACN require verification
    if (profile.entityType === 'business' && (profile.abn || profile.acn)) {
      return true;
    }

    // Organisers with paid events require verification
    if (profile.entityType === 'organiser' && profile.organiserData?.insuranceCertificate) {
      return true;
    }

    // Venues require verification
    if (profile.entityType === 'venue') {
      return true;
    }

    // Professionals claiming influencer status require verification
    if (
      profile.entityType === 'professional' &&
      profile.professionalData?.influencerLicence
    ) {
      return true;
    }

    return false;
  },

  /**
   * Get verification checklist for an entity type
   */
  getChecklistForEntityType(entityType: HostEntityType): VerificationChecklistItem[] {
    const commonChecklist: VerificationChecklistItem[] = [
      { item: 'Identity verification completed', checked: false },
      { item: 'Contact information verified', checked: false },
      { item: 'Address verified', checked: false },
    ];

    const entitySpecificChecklists: Record<HostEntityType, VerificationChecklistItem[]> = {
      community: [
        ...commonChecklist,
        { item: 'Community guidelines reviewed', checked: false },
        { item: 'Membership model validated', checked: false },
      ],
      organiser: [
        ...commonChecklist,
        { item: 'Insurance certificate verified', checked: false },
        { item: 'Insurance expiry date checked', checked: false },
        { item: 'Producer credentials validated', checked: false },
        { item: 'ABN verified (if applicable)', checked: false },
      ],
      venue: [
        ...commonChecklist,
        { item: 'Business registration verified', checked: false },
        { item: 'Fire safety capacity validated', checked: false },
        { item: 'Technical rider reviewed', checked: false },
        { item: 'Accessibility features verified', checked: false },
        { item: 'Public liability insurance checked', checked: false },
      ],
      business: [
        ...commonChecklist,
        { item: 'ABN/ACN verified', checked: false },
        { item: 'GST registration verified (if applicable)', checked: false },
        { item: 'Business category validated', checked: false },
        { item: 'Trading name verified (if different from official name)', checked: false },
      ],
      artist: [
        ...commonChecklist,
        { item: 'Portfolio reviewed', checked: false },
        { item: 'Genre/medium classification validated', checked: false },
        { item: 'Representation details verified (if applicable)', checked: false },
      ],
      professional: [
        ...commonChecklist,
        { item: 'Professional credentials verified', checked: false },
        { item: 'Influencer licence verified (if applicable)', checked: false },
        { item: 'Follower count validated (if influencer)', checked: false },
        { item: 'Expertise areas validated', checked: false },
      ],
    };

    return entitySpecificChecklists[entityType] || commonChecklist;
  },

  /**
   * Create a verification task
   */
  async createVerificationTask(
    data: Omit<CreateVerificationTask, 'status' | 'slaDeadline'>
  ): Promise<VerificationTask> {
    const now = new Date().toISOString();
    const slaDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours

    const taskRef = verificationTasksCol().doc();
    const task: VerificationTask = {
      id: taskRef.id,
      ...data,
      status: 'pending',
      submittedAt: now,
      slaDeadline,
    };

    await taskRef.set(task);
    return task;
  },

  /**
   * Get a verification task by ID
   */
  async getTask(taskId: string): Promise<VerificationTask | null> {
    const snap = await verificationTasksCol().doc(taskId).get();
    if (!snap.exists) return null;
    return { ...snap.data() as VerificationTask, id: snap.id };
  },

  /**
   * Get verification task for a profile
   */
  async getTaskForProfile(profileId: string): Promise<VerificationTask | null> {
    const snap = await verificationTasksCol()
      .where('profileId', '==', profileId)
      .orderBy('submittedAt', 'desc')
      .limit(1)
      .get();

    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { ...doc.data() as VerificationTask, id: doc.id };
  },

  /**
   * List verification tasks with filters
   */
  async listTasks(filters: {
    status?: VerificationTask['status'];
    entityType?: HostEntityType;
    assignedTo?: string;
    overdueSla?: boolean;
  } = {}): Promise<VerificationTask[]> {
    let query = verificationTasksCol() as FirebaseFirestore.Query;

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.entityType) {
      query = query.where('entityType', '==', filters.entityType);
    }
    if (filters.assignedTo) {
      query = query.where('assignedTo', '==', filters.assignedTo);
    }

    query = query.orderBy('submittedAt', 'desc');

    const snap = await query.get();
    let tasks = snap.docs.map(doc => ({ ...doc.data() as VerificationTask, id: doc.id }));

    // Filter by overdue SLA in memory (can't use Firestore query for this)
    if (filters.overdueSla) {
      const now = new Date().toISOString();
      tasks = tasks.filter(task => task.slaDeadline < now && task.status !== 'approved' && task.status !== 'rejected');
    }

    return tasks;
  },

  /**
   * Update a verification task
   */
  async updateTask(
    taskId: string,
    updates: Partial<Omit<VerificationTask, 'id' | 'profileId' | 'entityType' | 'submittedBy' | 'submittedAt'>>
  ): Promise<VerificationTask | null> {
    const taskRef = verificationTasksCol().doc(taskId);
    const existing = await taskRef.get();
    if (!existing.exists) return null;

    await taskRef.update(updates as FirebaseFirestore.UpdateData<VerificationTask>);

    const updated = await taskRef.get();
    return { ...(updated.data() as VerificationTask), id: updated.id };
  },

  /**
   * Approve a verification task
   */
  async approveTask(taskId: string, adminId: string, adminNotes?: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) throw new Error('Task not found');

    // Update task status
    await this.updateTask(taskId, {
      status: 'approved',
      assignedTo: adminId,
      adminNotes: adminNotes || task.adminNotes,
      completedAt: new Date().toISOString(),
    });

    // Update profile verification status
    await profilesCol().doc(task.profileId).update({
      verificationStatus: 'verified',
      status: 'published',
      verificationNotes: adminNotes || '',
    });
  },

  /**
   * Reject a verification task
   */
  async rejectTask(
    taskId: string,
    adminId: string,
    rejectionReason: string,
    adminNotes?: string
  ): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) throw new Error('Task not found');

    // Update task status
    await this.updateTask(taskId, {
      status: 'rejected',
      assignedTo: adminId,
      rejectionReason,
      adminNotes: adminNotes || task.adminNotes,
      completedAt: new Date().toISOString(),
    });

    // Update profile verification status
    await profilesCol().doc(task.profileId).update({
      verificationStatus: 'rejected',
      verificationNotes: rejectionReason,
    });
  },

  /**
   * Request more information for a verification task
   */
  async requestMoreInfo(
    taskId: string,
    adminId: string,
    requestMessage: string
  ): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) throw new Error('Task not found');

    // Update task status
    await this.updateTask(taskId, {
      status: 'more-info-needed',
      assignedTo: adminId,
      adminNotes: `${task.adminNotes}\n\n[More Info Requested] ${requestMessage}`,
    });

    // TODO: Send notification to profile owner
  },

  /**
   * Assign a verification task to an admin
   */
  async assignTask(taskId: string, adminId: string): Promise<void> {
    await this.updateTask(taskId, {
      status: 'in-review',
      assignedTo: adminId,
    });
  },

  /**
   * Get verification statistics
   */
  async getStatistics(): Promise<{
    pending: number;
    inReview: number;
    approved: number;
    rejected: number;
    moreInfoNeeded: number;
    overdueSla: number;
  }> {
    const allTasks = await verificationTasksCol().get();
    const tasks = allTasks.docs.map(doc => doc.data() as VerificationTask);
    const now = new Date().toISOString();

    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      inReview: tasks.filter(t => t.status === 'in-review').length,
      approved: tasks.filter(t => t.status === 'approved').length,
      rejected: tasks.filter(t => t.status === 'rejected').length,
      moreInfoNeeded: tasks.filter(t => t.status === 'more-info-needed').length,
      overdueSla: tasks.filter(
        t => t.slaDeadline < now && t.status !== 'approved' && t.status !== 'rejected'
      ).length,
    };
  },
};
