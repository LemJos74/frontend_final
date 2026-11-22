import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, maxLength, pattern, required } from '@angular/forms/signals';
import { AuthService } from '../../../core/auth/services/auth.service';
import { apiError } from '../../../shared/api-error';
import { FieldErrors } from '../../../shared/field-errors';

@Component({
  imports: [DatePipe, FormField, FieldErrors],
  styleUrl: './profile.scss',
  template: `
    <h1>Mi perfil</h1>
    @if (profile(); as user) {
      <div class="row g-4 mt-1">
        <section class="col-md-5" aria-labelledby="profile-account">
          <div class="surface profile-card h-100">
            <h2 id="profile-account">Datos de la cuenta</h2>
            <div class="d-flex align-items-center gap-3 border-bottom pb-3 mb-3">
              <span class="profile-avatar" aria-hidden="true">{{ initials() }}</span>
              <p class="fw-semibold fs-5 mb-0">{{ user.nombre }}</p>
            </div>
            <dl class="mb-0">
              <dt>Correo electrónico</dt><dd class="text-break">{{ user.email }}</dd>
              <dt>Rol</dt><dd><span class="badge profile-role">{{ user.rol }}</span></dd>
              <dt>Fecha de registro</dt><dd class="mb-0">{{ user.created_at | date:'dd/MM/yyyy' }}</dd>
            </dl>
          </div>
        </section>
        <section class="col-md-7" aria-labelledby="profile-edit">
          <div class="surface profile-card">
            <h2 id="profile-edit">Editar nombre</h2>
            <p class="text-secondary">Actualiza el nombre que se muestra en tu cuenta.</p>
            @if (error()) { <p class="alert alert-danger" role="alert">{{ error() }}</p> }
            @if (saved()) { <p class="alert alert-success" role="status">Nombre actualizado.</p> }
            <form novalidate (submit)="save($event)">
              <label class="form-label" for="profile-name">Nombre</label>
              <input id="profile-name" class="form-control" type="text" autocomplete="name"
                [formField]="fields.nombre" [class.is-invalid]="(attempted() || fields.nombre().touched()) && fields.nombre().invalid()" aria-describedby="profile-name-error">
              <app-field-errors errorId="profile-name-error" [errors]="fields.nombre().errors()" [visible]="attempted() || fields.nombre().touched()" />
              <div class="d-grid d-sm-flex mt-3"><button class="btn btn-primary" type="submit" [disabled]="busy()">{{ busy() ? 'Guardando…' : 'Guardar cambios' }}</button></div>
            </form>
          </div>
        </section>
      </div>
    }
  `,
})
export class Profile {
  private readonly auth = inject(AuthService);
  protected readonly profile = this.auth.profile;
  protected readonly initials = computed(() =>
    (this.profile()?.nombre ?? '').trim().split(/\s+/u).slice(0, 2)
      .map((part) => Array.from(part)[0] ?? '').join('').toLocaleUpperCase('es'),
  );
  private readonly model = signal({ nombre: this.profile()?.nombre ?? '' });
  protected readonly fields = form(this.model, (path) => {
    required(path.nombre, { message: 'Ingresa tu nombre.' });
    pattern(path.nombre, /\S/, { message: 'Ingresa tu nombre.' });
    maxLength(path.nombre, 120, { message: 'El nombre admite hasta 120 caracteres.' });
  });
  protected readonly attempted = signal(false);
  protected readonly busy = signal(false);
  protected readonly saved = signal(false);
  protected readonly error = signal('');

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    this.attempted.set(true);
    this.saved.set(false);
    if (this.fields().invalid() || this.busy()) return;

    this.error.set('');
    this.busy.set(true);
    try {
      const profile = await this.auth.updateName(this.model().nombre.trim());
      this.model.set({ nombre: profile.nombre });
      this.saved.set(true);
    } catch (error) {
      this.error.set(apiError(error, 'No se pudo actualizar tu perfil.'));
    } finally {
      this.busy.set(false);
    }
  }
}
