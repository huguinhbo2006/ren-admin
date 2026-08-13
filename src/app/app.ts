import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * App — Componente Raíz de Rentame Admin
 *
 * Solo renderiza el RouterOutlet. Todo el layout (sidebar, topbar)
 * está en ShellComponent, cargado por lazy loading vía el router.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `],
})
export class App {}
