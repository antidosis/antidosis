export const URGENT_CONTACT_MIN = 7;

export function getUrgencyLabel(value: number): string {
  if (value === 0) return "Whenever convenient";
  if (value <= 2) return "Flexible";
  if (value <= 4) return "Soon";
  if (value <= 6) return "Medium urgency";
  if (value <= 8) return "Urgent";
  return "As soon as possible";
}

export function getUrgencyTone(value: number): "quiet" | "medium" | "urgent" {
  if (value >= URGENT_CONTACT_MIN) return "urgent";
  if (value >= 5) return "medium";
  return "quiet";
}
