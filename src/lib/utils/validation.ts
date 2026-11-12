export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateIndianPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

export function validateCollegeId(id: string): boolean {
  if (!id || id.trim().length < 3) return false;
  return /^[A-Za-z0-9\-_/]+$/.test(id.trim());
}

export function normalizeCollegeId(id: string): string {
  return id.trim().toUpperCase();
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 100;
}

