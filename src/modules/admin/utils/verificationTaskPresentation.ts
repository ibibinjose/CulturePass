import type { VerificationTask } from '@/shared/schema';

export type VerificationSourceType = 'hostPage' | 'hostProfile';

export function getVerificationSourceType(task: VerificationTask): VerificationSourceType {
  return task.pageId ? 'hostPage' : 'hostProfile';
}

export function getVerificationSubjectLabel(task: VerificationTask): string {
  return task.pageId ? 'Host Page' : 'Host Profile';
}

export function getVerificationSubjectId(task: VerificationTask): string {
  return task.pageId ?? task.profileId ?? task.id;
}

export function getVerificationEntitySubtitle(task: VerificationTask, entityLabel: string): string {
  const source = getVerificationSubjectLabel(task);
  return `${entityLabel} · ${source}`;
}