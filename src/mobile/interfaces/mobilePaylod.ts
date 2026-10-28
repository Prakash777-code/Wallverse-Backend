export interface MobileJwtPaylod {
  userId: number;
  role: 'USER' | 'ADMIN';
  sessionVersion: number;
}
