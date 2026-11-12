import { createAdminClient } from '@/lib/supabase/admin';
import type { EventSettings } from '@/types/database';

export const DEFAULT_EVENT_SETTINGS: Partial<EventSettings> = {
  event_name: 'Freshers 2026',
  college_name: 'Jayawantrao Sawant College of Engineering',
  event_date: 'TBA',
  event_venue: 'TBA',
  registration_fee: 30000,
  maximum_capacity: 1000,
  registration_open: true,
  departments: ['Computer', 'IT', 'Mechanical', 'Electrical', 'E&TC', 'AIDS'],
  contact_email: '',
  contact_phone: '',
  event_description: 'Welcome to Freshers 2026 at Jayawantrao Sawant College of Engineering!',
};

export async function getEventSettings(): Promise<Partial<EventSettings>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return DEFAULT_EVENT_SETTINGS;
    }
    const supabase = createAdminClient();
    const { data: settings, error } = await supabase
      .from('event_settings')
      .select('event_name, college_name, event_date, event_venue, registration_fee, maximum_capacity, registration_open, departments, contact_email, contact_phone, event_description')
      .eq('id', 1)
      .single();

    if (error || !settings) {
      return DEFAULT_EVENT_SETTINGS;
    }

    return settings;
  } catch {
    return DEFAULT_EVENT_SETTINGS;
  }
}

