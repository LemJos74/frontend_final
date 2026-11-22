import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AccessToken, LoginRequest, UserProfile } from '../models/session.model';
import { SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);
  private readonly currentProfile = signal<UserProfile | null>(null);
  readonly profile = this.currentProfile.asReadonly();

  async login(credentials: LoginRequest): Promise<UserProfile> {
    const access = await firstValueFrom(this.http.post<AccessToken>('/api/auth/login', credentials));
    this.session.save(access);
    try {
      return await this.loadProfile();
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  async loadProfile(): Promise<UserProfile> {
    const profile = await firstValueFrom(this.http.get<UserProfile>('/api/auth/me'));
    this.currentProfile.set(profile);
    return profile;
  }

  async updateName(nombre: string): Promise<UserProfile> {
    const profile = await firstValueFrom(this.http.patch<UserProfile>('/api/auth/me', { nombre }));
    this.currentProfile.set(profile);
    return profile;
  }

  logout(): void {
    this.session.clear();
    this.currentProfile.set(null);
  }
}
