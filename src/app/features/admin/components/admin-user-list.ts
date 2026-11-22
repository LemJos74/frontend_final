import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormField, form, maxLength, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/services/auth.service';
import { apiError } from '../../../shared/api-error';
import { FieldErrors } from '../../../shared/field-errors';
import type { AdminUser, UserFilters } from '../models/admin-user.model';
import { AdminUsersService } from '../services/admin-users.service';

const emptyFilters: UserFilters = { busqueda: '', rol: '', activo: '' };
const pageSize = 20;

@Component({
  imports: [FormField, FieldErrors],
  templateUrl: './admin-user-list.html',
  styleUrl: './admin-user-list.scss',
})
export class AdminUserList {
  private readonly service = inject(AdminUsersService);
  private readonly confirmation = viewChild.required<ElementRef<HTMLDialogElement>>('confirmation');
  protected readonly profile = inject(AuthService).profile;
  private readonly model = signal(emptyFilters);
  private applied = emptyFilters;

  protected readonly filters = form(this.model, (path) => {
    maxLength(path.busqueda, 254, { message: 'La búsqueda admite hasta 254 caracteres.' });
    validate(path.busqueda, ({ value }) => value().includes('\0')
      ? { kind: 'search', message: 'La búsqueda contiene un carácter inválido.' } : null);
  });
  protected readonly attempted = signal(false);
  protected readonly users = signal<AdminUser[]>([]);
  protected readonly page = signal(0);
  protected readonly hasNext = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly target = signal<AdminUser | null>(null);
  protected readonly saving = signal(false);
  protected readonly changeError = signal('');

  constructor() {
    void this.load(0);
  }

  protected apply(event: Event): void {
    event.preventDefault();
    this.attempted.set(true);
    if (this.loading() || this.filters().invalid()) return;
    const values = this.model();
    this.applied = { ...values, busqueda: values.busqueda.trim() };
    this.success.set('');
    void this.load(0);
  }

  protected clear(): void {
    if (this.loading()) return;
    this.model.set(emptyFilters);
    this.applied = emptyFilters;
    this.attempted.set(false);
    this.success.set('');
    void this.load(0);
  }

  protected async load(page: number): Promise<void> {
    if (this.loading() || page < 0) return;
    this.page.set(page);
    this.loading.set(true);
    this.error.set('');
    try {
      let users = await firstValueFrom(this.service.list(pageSize + 1, page * pageSize, this.applied));
      if (page > 0 && !users.length) {
        this.page.set(page - 1);
        users = await firstValueFrom(this.service.list(pageSize + 1, (page - 1) * pageSize, this.applied));
      }
      this.users.set(users.slice(0, pageSize));
      this.hasNext.set(users.length > pageSize);
    } catch (error) {
      this.error.set(apiError(error, 'No se pudieron consultar los usuarios.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected isSelf(user: AdminUser): boolean {
    return user.id === this.profile()?.id;
  }

  protected requestChange(user: AdminUser): void {
    if (this.isSelf(user) || this.target() || this.loading()) return;
    this.changeError.set('');
    this.success.set('');
    this.target.set(user);
    this.confirmation().nativeElement.showModal();
  }

  protected close(event?: Event): void {
    event?.preventDefault();
    if (this.saving()) return;
    this.confirmation().nativeElement.close();
    this.target.set(null);
  }

  protected async confirm(): Promise<void> {
    const user = this.target();
    if (!user || this.isSelf(user) || this.saving()) return;
    this.saving.set(true);
    this.changeError.set('');
    try {
      const updated = await firstValueFrom(this.service.updateState(user.id, { activo: !user.activo }));
      this.success.set(updated.activo ? 'La cuenta se activó.' : 'La cuenta se desactivó.');
    } catch (error) {
      this.changeError.set(this.stateError(error));
      return;
    } finally {
      this.saving.set(false);
    }
    this.close();
    await this.load(this.page());
  }

  private stateError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) return 'No se puede desactivar al último administrador activo.';
      if (error.status === 422 && error.error?.detail === 'No puede desactivar su propia cuenta') {
        return 'No puedes desactivar tu propia cuenta.';
      }
    }
    return apiError(error, 'No se pudo cambiar el estado de la cuenta.');
  }
}
