import { Component, inject, signal } from '@angular/core';
import { FormField, email, form, maxLength, minLength, pattern, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { apiError } from '../../../shared/api-error';
import { FieldErrors } from '../../../shared/field-errors';
import { RegistrationService } from '../services/registration.service';

@Component({
  imports: [FormField, RouterLink, FieldErrors],
  template: `
    <h1>Crear cuenta</h1>
    <p class="text-secondary">Regístrate como ciudadano.</p>
    @if (error()) { <p class="alert alert-danger" role="alert">{{ error() }}</p> }
    <form class="d-grid gap-3" novalidate (submit)="register($event)">
      <div>
        <label class="form-label" for="register-name">Nombre</label>
        <input id="register-name" class="form-control" type="text" autocomplete="name"
          [formField]="fields.nombre" [class.is-invalid]="(attempted() || fields.nombre().touched()) && fields.nombre().invalid()" aria-describedby="register-name-error">
        <app-field-errors errorId="register-name-error" [errors]="fields.nombre().errors()" [visible]="attempted() || fields.nombre().touched()" />
      </div>
      <div>
        <label class="form-label" for="register-email">Correo electrónico</label>
        <input id="register-email" class="form-control" type="email" autocomplete="email"
          [formField]="fields.email" [class.is-invalid]="(attempted() || fields.email().touched()) && fields.email().invalid()" aria-describedby="register-email-error">
        <app-field-errors errorId="register-email-error" [errors]="fields.email().errors()" [visible]="attempted() || fields.email().touched()" />
      </div>
      <div>
        <label class="form-label" for="register-password">Contraseña</label>
        <input id="register-password" class="form-control" type="password" autocomplete="new-password"
          [formField]="fields.password" [class.is-invalid]="(attempted() || fields.password().touched()) && fields.password().invalid()" aria-describedby="register-password-hint register-password-error">
        <div class="form-text" id="register-password-hint">Usa al menos 8 caracteres.</div>
        <app-field-errors errorId="register-password-error" [errors]="fields.password().errors()" [visible]="attempted() || fields.password().touched()" />
      </div>
      <button class="btn btn-primary mt-2" type="submit" [disabled]="busy()">{{ busy() ? 'Creando cuenta…' : 'Crear cuenta' }}</button>
    </form>
    <p class="mt-4 mb-0">¿Ya tienes cuenta? <a routerLink="/login">Iniciar sesión</a></p>
  `,
})
export class Register {
  private readonly registration = inject(RegistrationService);
  private readonly router = inject(Router);
  private readonly model = signal({ nombre: '', email: '', password: '' });
  protected readonly fields = form(this.model, (path) => {
    required(path.nombre, { message: 'Ingresa tu nombre.' });
    pattern(path.nombre, /\S/, { message: 'Ingresa tu nombre.' });
    maxLength(path.nombre, 120, { message: 'El nombre admite hasta 120 caracteres.' });
    required(path.email, { message: 'Ingresa tu correo electrónico.' });
    email(path.email, { message: 'Ingresa un correo válido.' });
    required(path.password, { message: 'Ingresa una contraseña.' });
    minLength(path.password, 8, { message: 'La contraseña debe tener al menos 8 caracteres.' });
  });
  protected readonly attempted = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected async register(event: Event): Promise<void> {
    event.preventDefault();
    this.attempted.set(true);
    if (this.fields().invalid() || this.busy()) return;

    this.error.set('');
    this.busy.set(true);
    const { nombre, email, password } = this.model();
    try {
      await this.registration.register({ nombre: nombre.trim(), email: email.trim(), password });
      await this.router.navigate(['/login'], { queryParams: { registro: 'ok' }, replaceUrl: true });
    } catch (error) {
      this.error.set(apiError(error, 'No se pudo crear la cuenta.'));
    } finally {
      this.busy.set(false);
    }
  }
}
