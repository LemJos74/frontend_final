import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RegistrationRequest, RegistrationResponse } from '../models/registration.model';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly http = inject(HttpClient);

  register(registration: RegistrationRequest): Promise<RegistrationResponse> {
    return firstValueFrom(this.http.post<RegistrationResponse>('/api/usuarios/registro', registration));
  }
}
