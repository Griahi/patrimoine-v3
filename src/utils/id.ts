export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateShortId(): string {
  return Math.random().toString(36).substr(2, 8);
} 