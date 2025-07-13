export enum UserRole {
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
  EMPLOYER = 'EMPLOYER'
}

export interface User {
  id: string; // UUID
  email: string;
  userRole: UserRole;
  completeProfile: boolean;
  createdAt: Date;
}
