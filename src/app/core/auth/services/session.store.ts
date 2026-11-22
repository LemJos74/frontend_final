import { Injectable, signal } from '@angular/core';
import { AccessToken } from '../models/session.model';

const sessionKey = 'limpiahuancayo.session';

interface Session {
  token: string;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly state = signal(this.restore());

  token(): string | null {
    const session = this.state();
    if (!session) return null;
    if (Date.now() >= session.expiresAt) {
      this.clear();
      return null;
    }
    return session.token;
  }

  save(access: AccessToken): void {
    const session = { token: access.access_token, expiresAt: Date.now() + access.expires_in * 1000 };
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    this.state.set(session);
  }

  clear(): void {
    sessionStorage.removeItem(sessionKey);
    this.state.set(null);
  }

  private restore(): Session | null {
    try {
      const stored = JSON.parse(sessionStorage.getItem(sessionKey) ?? 'null') as Session | null;
      return stored && typeof stored.token === 'string' && Number.isFinite(stored.expiresAt) ? stored : null;
    } catch {
      return null;
    }
  }
}
