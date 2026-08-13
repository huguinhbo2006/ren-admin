import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SettingService } from './services/setting.service';
import { AuthService } from '../../core/auth/auth.service';

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

  readonly activeTab = signal<'business' | 'contract' | 'notifications' | 'plan'>('business');
  readonly saving = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly settings = this.settingService.settings;
  readonly planUsage = this.settingService.planUsage;
  readonly loading = this.settingService.loading;

  readonly businessForm: FormGroup = this.fb.group({
    business_name: ['', [Validators.required]],
    business_rfc: [''],
    business_phone: [''],
    business_address: [''],
    contract_template: [''],
    notification_days_before: ['3', [Validators.required]],
    invoice_prefix: ['RNT'],
  });

  ngOnInit(): void {
    this.settingService.loadSettings().subscribe((res) => {
      this.businessForm.patchValue(res.data);
    });
    this.settingService.loadPlanUsage().subscribe();
  }

  setTab(tab: 'business' | 'contract' | 'notifications' | 'plan'): void {
    this.activeTab.set(tab);
    this.successMessage.set(null);
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
