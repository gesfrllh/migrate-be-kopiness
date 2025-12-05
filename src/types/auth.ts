// src/types/auth.ts
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  password?(password: any) {
    throw new Error('Method not implemented.');
  }
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
