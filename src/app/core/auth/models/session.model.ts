export type Role = 'Ciudadano' | 'Administrador';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AccessToken {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface UserProfile {
  id: number;
  nombre: string;
  email: string;
  rol: Role;
  created_at: string;
}

export const profilePath = (role: Role) =>
  role === 'Administrador' ? '/admin/perfil' : '/ciudadano/perfil';

export const landingPath = (role: Role) =>
  role === 'Administrador' ? '/admin/dashboard' : '/ciudadano/reportes';
