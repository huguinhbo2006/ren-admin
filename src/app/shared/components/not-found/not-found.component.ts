import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'rm-not-found',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="rm-page-enter"><p>NotFound — En desarrollo</p></div>`,
})
export class NotFoundComponent {}
