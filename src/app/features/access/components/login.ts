import { Component, inject, signal } from '@angular/core';
import { FormField, email, form, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { landingPath } from '../../../core/auth/models/session.model';
import { AuthService } from '../../../core/auth/services/auth.service';
import { apiError } from '../../../shared/api-error';
import { FieldErrors } from '../../../shared/field-errors';

@Component({
  imports: [FormField, RouterLink, FieldErrors],
  template: `
    <h1>Iniciar sesión</h1>
    @if (registered) {
      <p class="alert alert-success" role="status">Tu cuenta se creó correctamente. Ya puedes ingresar.</p>
    }
    @if (error()) { <p class="alert alert-danger" role="alert">{{ error() }}</p> }
    <form class="d-grid gap-3" novalidate (submit)="login($event)">
      <div>
        <label class="form-label" for="login-email">Correo electrónico</label>
        <input id="login-email" class="form-control" type="email" autocomplete="username"
          [formField]="fields.email" [class.is-invalid]="(attempted() || fields.email().touched()) && fields.email().invalid()" aria-describedby="login-email-error">
        <app-field-errors errorId="login-email-error" [errors]="fields.email().errors()" [visible]="attempted() || fields.email().touched()" />
      </div>
      <div>
        <label class="form-label" for="login-password">Contraseña</label>
        <input id="login-password" class="form-control" type="password" autocomplete="current-password"
          [formField]="fields.password" [class.is-invalid]="(attempted() || fields.password().touched()) && fields.password().invalid()" aria-describedby="login-password-error">
        <app-field-errors errorId="login-password-error" [errors]="fields.password().errors()" [visible]="attempted() || fields.password().touched()" />
      </div>
      <button class="btn btn-primary mt-2" type="submit" [disabled]="busy()">{{ busy() ? 'Ingresando…' : 'Ingresar' }}</button>
    </form>
    <p class="mt-4 mb-0">¿Aún no tienes una cuenta? <a routerLink="/registro">Registrarme</a></p>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly registered = inject(ActivatedRoute).snapshot.queryParamMap.get('registro') === 'ok';
  private readonly credentials = signal({ email: '', password: '' });
  protected readonly fields = form(this.credentials, (path) => {
    required(path.email, { message: 'Ingresa tu correo electrónico.' });
    email(path.email, { message: 'Ingresa un correo válido.' });
    required(path.password, { message: 'Ingresa tu contraseña.' });
  });
  protected readonly attempted = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected async login(event: Event): Promise<void> {
    event.preventDefault();
    this.attempted.set(true);
    if (this.fields().invalid() || this.busy()) return;

    this.error.set('');
    this.busy.set(true);
    const { email, password } = this.credentials();
    try {
      const profile = await this.auth.login({ email: email.trim(), password });
      await this.router.navigateByUrl(landingPath(profile.rol), { replaceUrl: true, info: profile });
    } catch (error) {
      this.error.set(apiError(error, 'No se pudo iniciar sesión.'));
    } finally {
      this.busy.set(false);
    }
  }
}
