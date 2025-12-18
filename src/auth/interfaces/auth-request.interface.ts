import { Request } from "@nestjs/common";

export interface JWTPayload {
  id: string;
  role: string
}

export interface AuthRequest extends Request {
  user: JWTPayload
}