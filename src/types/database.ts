export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type EntryStatus = 'not_entered' | 'entered';
export type EmailDeliveryStatus = 'pending' | 'sent' | 'failed';
export type ScanResult = 'success' | 'already_entered' | 'invalid' | 'unpaid';

export interface Registration {
  id: string;
  registration_id: string;
  student_name: string;
  department: string;
  college_id: string;
  phone: string;
  email: string;
  payment_status: PaymentStatus;
  entry_status: EntryStatus;
  ticket_token_hash: string | null;
  paytm_order_id?: string | null;
  razorpay_order_id?: string | null;
  reservation_expires_at: string | null;
  entered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  registration_id: string;
  paytm_order_id?: string | null;
  paytm_txn_id?: string | null;
  utr_number?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface AdminProfile {
  id: string;
  auth_user_id: string;
  name: string;
  role: 'admin' | 'super_admin';
  created_at: string;
}

export interface EntryLog {
  id: string;
  registration_id: string;
  admin_id: string;
  scanned_at: string;
  result: ScanResult;
}

export interface EventSettings {
  id: number;
  event_name: string;
  college_name: string;
  event_date: string;
  event_venue: string;
  registration_fee: number;
  maximum_capacity: number;
  registration_open: boolean;
  departments: string[];
  contact_email: string;
  contact_phone: string;
  event_description: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  registration_id: string;
  email_type: string;
  delivery_status: EmailDeliveryStatus;
  sent_at: string | null;
  error_message: string | null;
}

export interface WebhookEvent {
  id: string;
  razorpay_event_id: string;
  event_type: string;
  processed_at: string | null;
  processing_status: string;
}

