import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SettingService } from './services/setting.service';
import { AuthService } from '../../core/auth/auth.service';
import { ExpenseCategoryService, ExpenseCategoryItem } from '../expenses/services/expense-category.service';
import { ExtraServiceService } from '../rentals/services/extra-service.service';
import type { ExtraService } from '../../shared/models';

@Component({
  selector: 'rm-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly settingService = inject(SettingService);
  readonly authService = inject(AuthService);
  readonly categoryService = inject(ExpenseCategoryService);
  readonly extraService = inject(ExtraServiceService);

  readonly activeTab = signal<'business' | 'contract' | 'notifications' | 'catalogs' | 'plan'>('business');
  readonly activeCatalogSubTab = signal<'expense' | 'extra'>('expense');

  readonly saving = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly settings = this.settingService.settings;
  readonly planUsage = this.settingService.planUsage;
  readonly loading = this.settingService.loading;
  readonly categories = this.categoryService.categories;
  readonly extraServices = this.extraService.services;

  readonly businessForm: FormGroup = this.fb.group({
    business_name: ['', [Validators.required]],
    business_rfc: [''],
    business_phone: [''],
    business_address: [''],
    contract_template: [''],
    notification_days_before: ['3', [Validators.required]],
    invoice_prefix: ['RNT'],
  });

  readonly newCategoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
  });

  readonly newExtraForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    unit: ['por servicio', [Validators.required]],
    description: [''],
  });

  ngOnInit(): void {
    this.settingService.loadSettings().subscribe((res) => {
      this.businessForm.patchValue(res.data);
    });
    this.settingService.loadPlanUsage().subscribe();
    this.categoryService.loadCategories().subscribe();
    this.extraService.loadServices().subscribe();
  }

  setTab(tab: 'business' | 'contract' | 'notifications' | 'catalogs' | 'plan'): void {
    this.activeTab.set(tab);
    this.successMessage.set(null);
  }

  setCatalogSubTab(subTab: 'expense' | 'extra'): void {
    this.activeCatalogSubTab.set(subTab);
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.settingService.uploadLogo(file).subscribe({
        next: () => {
          this.showSuccess('Logotipo del negocio actualizado exitosamente.');
        },
      });
    }
  }

  saveCategory(): void {
    if (this.newCategoryForm.invalid) return;
    this.categoryService.createCategory(this.newCategoryForm.value).subscribe({
      next: () => {
        this.newCategoryForm.reset();
        this.showSuccess('Nuevo tipo de gasto registrado en tu catálogo.');
      }
    });
  }

  deleteCategory(cat: ExpenseCategoryItem, event: Event): void {
    event.stopPropagation();
    if (confirm(`¿Eliminar la categoría de egreso "${cat.name}"?`)) {
      this.categoryService.deleteCategory(cat.id).subscribe({
        next: () => this.showSuccess('Categoría eliminada.')
      });
    }
  }

  saveExtraService(): void {
    if (this.newExtraForm.invalid) return;
    const fv = this.newExtraForm.value;
    this.extraService.createService({
      name: fv.name,
      price_cents: Math.round(parseFloat(fv.price) * 100),
      unit: fv.unit,
      description: fv.description,
    }).subscribe({
      next: () => {
        this.newExtraForm.reset({ unit: 'por servicio', price: 0 });
        this.showSuccess('Nuevo servicio extra guardado en el catálogo.');
      }
    });
  }

  deleteExtraService(svc: ExtraService, event: Event): void {
    event.stopPropagation();
    if (confirm(`¿Eliminar el servicio extra "${svc.name}"?`)) {
      this.extraService.deleteService(svc.id).subscribe({
        next: () => this.showSuccess('Servicio extra eliminado.')
      });
    }
  }

  saveSettings(): void {
    if (this.businessForm.invalid || this.saving()) {
      this.businessForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.successMessage.set(null);

    this.settingService.updateSettings(this.businessForm.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.showSuccess('Configuración guardada correctamente.');
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  upgradeToPro(): void {
    if (confirm('¿Deseas activar tu suscripción al Plan Pro y desbloquear todas las funciones ilimitadas?')) {
      this.settingService.subscribeToPlan('pro').subscribe({
        next: () => {
          this.showSuccess('¡Felicidades! Has sido actualizado al Plan Pro.');
          this.authService.me().subscribe();
        },
      });
    }
  }

  private showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 4000);
  }
}
