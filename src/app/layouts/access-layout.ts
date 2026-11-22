import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Brand } from '../shared/brand';

@Component({
  imports: [Brand, RouterOutlet],
  styleUrl: './access-layout.scss',
  template: `
    <main class="access-layout">
      <aside class="access-aside">
        <app-brand />
        <p>Reporta y da seguimiento a puntos de acumulación de residuos en Huancayo.</p>
      </aside>
      <div class="access-body">
        <div class="access-card"><router-outlet /></div>
      </div>
    </main>
  `,
})
export class AccessLayout {}
