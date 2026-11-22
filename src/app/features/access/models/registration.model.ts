import { LoginRequest } from '../../../core/auth/models/session.model';

export interface RegistrationRequest extends LoginRequest {
  nombre: string;
}

export interface RegistrationResponse {
  id: number;
}
