import type { StepTypeDefinition, PaletteGroup } from '../types';

export const STEP_TYPES: StepTypeDefinition[] = [
  // Start/End
  {
    type: 'initial',
    labelAr: 'مسودة / بداية',
    labelEn: 'Draft / Start',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    defaultStateName: 'draft',
    isInitial: true,
    group: 'start_end',
  },
  {
    type: 'finalApproved',
    labelAr: 'اعتماد نهائي',
    labelEn: 'Final Approved',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-400',
    defaultStateName: 'approved',
    isFinal: true,
    group: 'start_end',
  },
  {
    type: 'finalRejected',
    labelAr: 'رفض نهائي',
    labelEn: 'Final Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    defaultStateName: 'rejected',
    isFinal: true,
    group: 'start_end',
  },
  // Approval
  {
    type: 'singleApproval',
    labelAr: 'اعتماد فردي',
    labelEn: 'Single Approval',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    defaultStateName: 'pending_approval',
    group: 'approval',
  },
  {
    type: 'headApproval',
    labelAr: 'اعتماد الرئيس',
    labelEn: 'Head Approval',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    defaultStateName: 'head_review',
    defaultRole: 'CommitteeHead',
    group: 'approval',
  },
  {
    type: 'secretaryApproval',
    labelAr: 'اعتماد الأمين',
    labelEn: 'Secretary Approval',
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-300',
    defaultStateName: 'secretary_review',
    defaultRole: 'CommitteeSecretary',
    group: 'approval',
  },
  // Review
  {
    type: 'review',
    labelAr: 'مراجعة',
    labelEn: 'Review',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    defaultStateName: 'under_review',
    group: 'review',
  },
  // Actions
  {
    type: 'notify',
    labelAr: 'إشعار',
    labelEn: 'Notification',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
    defaultStateName: 'notify',
    group: 'actions',
  },
  {
    type: 'condition',
    labelAr: 'شرط',
    labelEn: 'Condition',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    defaultStateName: 'check',
    group: 'actions',
  },
];

export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    key: 'start_end',
    labelAr: 'البداية والنهاية',
    labelEn: 'Start & End',
    items: STEP_TYPES.filter(s => s.group === 'start_end'),
  },
  {
    key: 'approval',
    labelAr: 'الاعتماد',
    labelEn: 'Approval',
    items: STEP_TYPES.filter(s => s.group === 'approval'),
  },
  {
    key: 'review',
    labelAr: 'المراجعة',
    labelEn: 'Review',
    items: STEP_TYPES.filter(s => s.group === 'review'),
  },
  {
    key: 'actions',
    labelAr: 'الإجراءات',
    labelEn: 'Actions',
    items: STEP_TYPES.filter(s => s.group === 'actions'),
  },
];

export function getStepTypeDef(type: string): StepTypeDefinition {
  return STEP_TYPES.find(s => s.type === type) ?? STEP_TYPES[0];
}

export const AVAILABLE_ROLES = [
  { value: 'SystemAdmin', labelAr: 'مدير النظام', labelEn: 'System Admin' },
  { value: 'CommitteeHead', labelAr: 'رئيس اللجنة', labelEn: 'Committee Head' },
  { value: 'CommitteeSecretary', labelAr: 'أمين اللجنة', labelEn: 'Committee Secretary' },
  { value: 'CommitteeMember', labelAr: 'عضو لجنة', labelEn: 'Committee Member' },
  { value: 'Observer', labelAr: 'مراقب', labelEn: 'Observer' },
];

export const DOMAIN_OPTIONS = [
  { value: 'MOM', labelAr: 'محاضر الاجتماعات', labelEn: 'Meeting Minutes' },
  { value: 'Committee', labelAr: 'اللجان', labelEn: 'Committees' },
  { value: 'Meeting', labelAr: 'الاجتماعات', labelEn: 'Meetings' },
  { value: 'Task', labelAr: 'المهام', labelEn: 'Tasks' },
  { value: 'Decision', labelAr: 'القرارات', labelEn: 'Decisions' },
];
