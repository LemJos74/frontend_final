import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { profilePath } from '../core/auth/models/session.model';
import { AuthService } from '../core/auth/services/auth.service';
import { Brand } from '../shared/brand';

@Component({
  imports: [Brand, RouterLink, RouterLinkActive, RouterOutlet],
  styleUrl: './workspace-layout.scss',
  template: `
    <header class="workspace-header">
      <div class="container d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
        <app-brand />
        <button #menuTrigger type="button" class="btn btn-outline-light d-md-none" aria-controls="workspace-nav" [attr.aria-expanded]="menuOpen()" (click)="toggleMenu()">Menú</button>
        <nav id="workspace-nav" aria-label="Menú de cuenta" class="workspace-nav d-md-flex align-items-md-center flex-wrap gap-2 gap-lg-3" [class.d-none]="!menuOpen()" [class.d-flex]="menuOpen()" (keydown.escape)="returnToMenu($event)">
          @if (isCitizen()) {
            <a class="profile-link" routerLink="/ciudadano/reportes" [class.active]="citizenReportsActive()" [attr.aria-current]="citizenReportsCurrent()" (click)="closeMenu()">Mis reportes</a>
            <a class="profile-link" routerLink="/ciudadano/reportes/nuevo" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="closeMenu()">Nuevo reporte</a>
          } @else {
            <a class="profile-link" routerLink="/admin/dashboard" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="closeMenu()">Panel</a>
            <a class="profile-link" routerLink="/admin/reportes" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="closeMenu()">Reportes</a>
            <a class="profile-link" routerLink="/admin/usuarios" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="closeMenu()">Usuarios</a>
          }
          <a class="profile-link" [routerLink]="home()" routerLinkActive="active" ariaCurrentWhenActive="page" (click)="closeMenu()">Mi perfil</a>
          <button class="btn btn-outline-light" type="button" (click)="logout()">Cerrar sesión</button>
        </nav>
      </div>
    </header>
    <main class="container workspace-content py-4 py-md-5">
      <p class="workspace-role">{{ area() }}</p>
      <router-outlet />
    </main>
  `,
})
export class WorkspaceLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly isCitizen = computed(() => this.auth.profile()?.rol === 'Ciudadano');
  protected readonly area = computed(() => this.auth.profile()?.rol === 'Administrador' ? 'Administración' : 'Área ciudadana');
  protected readonly home = computed(() => profilePath(this.auth.profile()?.rol ?? 'Ciudadano'));

  private readonly menuTrigger = viewChild.required<ElementRef<HTMLButtonElement>>('menuTrigger');
  private readonly url = toSignal(this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects),
  ), { initialValue: this.router.url });
  private readonly path = computed(() => this.url().split(/[?#]/, 1)[0]);
  protected readonly citizenReportsActive = computed(() =>
    this.path() === '/ciudadano/reportes' || /^\/ciudadano\/reportes\/\d+$/.test(this.path()),
  );
  protected readonly citizenReportsCurrent = computed(() =>
    this.path() === '/ciudadano/reportes' ? 'page' : this.citizenReportsActive() ? 'location' : null,
  );
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void { this.menuOpen.update((open) => !open); }
  protected closeMenu(): void { this.menuOpen.set(false); }

  protected returnToMenu(event: Event): void {
    if (!this.menuOpen()) return;
    event.preventDefault();
    this.closeMenu();
    this.menuTrigger().nativeElement.focus();
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
