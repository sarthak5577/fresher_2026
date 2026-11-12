export const DEPARTMENTS = [
  'Computer',
  'IT',
  'Mechanical',
  'Electrical',
  'E&TC',
  'AIDS',
] as const;

export type Department = typeof DEPARTMENTS[number];

export const REGISTRATION_FEE_INR = 300;
export const REGISTRATION_FEE_PAISE = 30000;
export const MAX_CAPACITY = 1000;
export const COLLEGE_NAME = 'Jayawantrao Sawant College of Engineering';
export const EVENT_NAME = 'Freshers 2026';
export const RESERVATION_EXPIRY_MINUTES = 15;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const ENTRY_STATUS = {
  NOT_ENTERED: 'not_entered',
  ENTERED: 'entered',
} as const;

