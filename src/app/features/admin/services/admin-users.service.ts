import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { AdminUser, UpdatedUserState, UserFilters, UserStateChange } from '../models/admin-user.model';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);

  list(limit: number, offset: number, filters: UserFilters) {
    let params = new HttpParams().set('limite', limit).set('desplazamiento', offset);
    if (filters.busqueda) params = params.set('busqueda', filters.busqueda);
    if (filters.rol) params = params.set('rol', filters.rol);
    if (filters.activo !== '') params = params.set('activo', filters.activo);
    return this.http.get<AdminUser[]>('/api/admin/usuarios', { params });
  }

  updateState(id: number, change: UserStateChange) {
    return this.http.patch<UpdatedUserState>('/api/admin/usuarios/' + id + '/estado', change);
  }
}
