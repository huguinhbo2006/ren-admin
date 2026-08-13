import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  OnDestroy,
  inject,
  effect,
} from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

/**
 * FeatureFlagDirective — *rmFeatureFlag
 *
 * Muestra/oculta elementos según el plan del usuario.
 * Equivalente estructural de *ngIf pero basado en features del plan.
 *
 * Uso:
 *   <button *rmFeatureFlag="'reports.export'">Exportar PDF</button>
 *   <div *rmFeatureFlag="'reports'; else upgradeBanner">...</div>
 *
 * Features disponibles (ver instrucciones.md):
 *   'reports', 'export_pdf', 'export_excel', 'multi_user',
 *   'contract_pdf', 'audit_log', 'advanced_dashboard'
 */
@Directive({
  selector: '[rmFeatureFlag]',
  standalone: true,
})
export class FeatureFlagDirective implements OnInit, OnDestroy {
  @Input('rmFeatureFlag') feature = '';
  @Input('rmFeatureFlagElse') elseTemplate?: TemplateRef<unknown>;

  private readonly templateRef   = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService   = inject(AuthService);

  private hasView = false;

  /** Reactivo a cambios de plan con effect() */
  private readonly planEffect = effect(() => {
    // Acceder a isPro crea una dependencia reactiva
    void this.authService.isPro();
    this.updateView();
  });

  ngOnInit(): void {
    this.updateView();
  }

  ngOnDestroy(): void {
    this.planEffect.destroy();
  }

  private updateView(): void {
    const hasAccess = this.authService.hasFeature(this.feature);

    if (hasAccess && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;

      // Si hay template alternativo, mostrarlo
      if (this.elseTemplate) {
        this.viewContainer.createEmbeddedView(this.elseTemplate);
      }
    } else if (!hasAccess && !this.hasView && this.elseTemplate) {
      this.viewContainer.createEmbeddedView(this.elseTemplate);
    }
  }
}
