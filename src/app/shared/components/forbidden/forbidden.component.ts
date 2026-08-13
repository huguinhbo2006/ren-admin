import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'rm-forbidden',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="rm-page-enter"><p>Forbidden — En desarrollo</p></div>`,
})
export class ForbiddenComponent {}
