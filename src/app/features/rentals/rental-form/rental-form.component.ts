import { Component, OnInit, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RentalService } from '../services/rental.service';
import { AssetService } from '../../assets/services/asset.service';
import { CustomerService } from '../../customers/services/customer.service';
import { ExtraServiceService } from '../services/extra-service.service';
import { CurrencyMxnPipe } from '../../../shared/pipes/currency-mxn.pipe';
import type { Asset, Customer, ExtraService } from '../../../shared/models';

@Component({
  selector: 'rm-rental-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyMxnPipe],
  templateUrl: './rental-form.component.html',
  styleUrls: ['./rental-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentalFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly rentalService = inject(RentalService);
  private readonly assetService = inject(AssetService);
  private readonly customerService = inject(CustomerService);
  private readonly extraService = inject(ExtraServiceService);
  private readonly router = inject(Router);

  readonly customers = this.customerService.customers;
  readonly assets = this.assetService.assets;
  readonly extraServices = this.extraService.services;

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedAsset = signal<Asset | null>(null);
  readonly rentalDays = signal<number>(1);
  readonly baseAmountCents = signal<number>(0);
  readonly extrasTotalCents = signal<number>(0);

  readonly rentalForm: FormGroup = this.fb.group({
    customer_id: [null, [Validators.required]],
    asset_id: [null, [Validators.required]],
    start_date: [new Date().toISOString().split('T')[0], [Validators.required]],
    end_date: [new Date().toISOString().split('T')[0], [Validators.required]],
    deposit: [0, [Validators.min(0)]],
    discount: [0, [Validators.min(0)]],
    notes: [''],
    selected_extras: this.fb.array([]),
  });

  readonly totalCalculatedCents = computed(() => {
    const depositCents = Math.round(parseFloat(this.rentalForm.get('deposit')?.value || 0) * 100);
    const discountCents = Math.round(parseFloat(this.rentalForm.get('discount')?.value || 0) * 100);
    return Math.max(0, this.baseAmountCents() + this.extrasTotalCents() + depositCents - discountCents);
  });

  ngOnInit(): void {
    this.customerService.loadCustomers({ is_active: true }).subscribe();
    this.assetService.loadAssets({ status: 'available' }).subscribe();
    this.extraService.loadServices().subscribe();

    this.rentalForm.get('asset_id')?.valueChanges.subscribe((assetId) => {
      if (assetId) {
        const found = this.assets().find((a) => a.id === parseInt(assetId, 10)) || null;
        this.selectedAsset.set(found);
        if (found && found.deposit_cents) {
          this.rentalForm.patchValue({ deposit: found.deposit_cents / 100 });
        }
        this.recalculateRates();
      }
    });

    this.rentalForm.get('start_date')?.valueChanges.subscribe(() => this.recalculateRates());
    this.rentalForm.get('end_date')?.valueChanges.subscribe(() => this.recalculateRates());
  }

  get extrasArray(): FormArray {
    return this.rentalForm.get('selected_extras') as FormArray;
  }

  onExtraToggle(service: ExtraService, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.extrasArray.push(this.fb.group({
        extra_service_id: [service.id],
        name: [service.name],
        unit_price_cents: [service.price_cents],
        quantity: [1, [Validators.required, Validators.min(1)]],
      }));
    } else {
      const idx = this.extrasArray.controls.findIndex(
        (c) => c.get('extra_service_id')?.value === service.id
      );
      if (idx !== -1) {
        this.extrasArray.removeAt(idx);
      }
    }
    this.recalculateExtras();
  }

  onQuantityChange(): void {
    this.recalculateExtras();
  }

  private recalculateExtras(): void {
    let total = 0;
    for (const ctrl of this.extrasArray.controls) {
      const price = ctrl.get('unit_price_cents')?.value || 0;
      const qty = ctrl.get('quantity')?.value || 1;
      total += price * qty;
    }
    this.extrasTotalCents.set(total);
  }

  private recalculateRates(): void {
    const startStr = this.rentalForm.get('start_date')?.value;
    const endStr = this.rentalForm.get('end_date')?.value;
    const asset = this.selectedAsset();

    if (!startStr || !endStr || !asset) return;

    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    this.rentalDays.set(diffDays);

    let base = asset.daily_rate_cents * diffDays;
    if (asset.monthly_rate_cents && diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      const remDays = diffDays % 30;
      base = (months * asset.monthly_rate_cents) + (remDays * asset.daily_rate_cents);
    } else if (asset.weekly_rate_cents && diffDays >= 7) {
      const weeks = Math.floor(diffDays / 7);
      const remDays = diffDays % 7;
      base = (weeks * asset.weekly_rate_cents) + (remDays * asset.daily_rate_cents);
    }

    this.baseAmountCents.set(base);
  }

  onSubmit(): void {
    if (this.rentalForm.invalid || this.saving()) {
      this.rentalForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const fv = this.rentalForm.value;
    const extrasPayload = this.extrasArray.controls.map((ctrl) => ({
      extra_service_id: ctrl.get('extra_service_id')?.value,
      quantity: ctrl.get('quantity')?.value,
      unit_price_cents: ctrl.get('unit_price_cents')?.value,
    }));

    const payload = {
      customer_id: parseInt(fv.customer_id, 10),
      asset_id: parseInt(fv.asset_id, 10),
      start_date: fv.start_date,
      end_date: fv.end_date,
      deposit_cents: Math.round(parseFloat(fv.deposit || 0) * 100),
      discount_cents: Math.round(parseFloat(fv.discount || 0) * 100),
      notes: fv.notes || null,
      extras: extrasPayload.length > 0 ? extrasPayload : undefined,
    };

    this.rentalService.createRental(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/rentals']);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(
          err.error?.message || 'Error al generar el contrato de renta.'
        );
      },
    });
  }
}
