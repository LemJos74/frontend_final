import type { Role } from '../../../core/auth/models/session.model';

export interface AdminUser {
  id: number;
  nombre: string;
  email: string;
  rol_id: number;
  rol: Role;
  activo: boolean;
  created_at: string;
}

export interface UserFilters {
  busqueda: string;
  rol: Role | '';
  activo: 'true' | 'false' | '';
}

export interface UserStateChange {
  activo: boolean;
}

export interface UpdatedUserState extends UserStateChange {
  id: number;
  updated_at: string;
}
