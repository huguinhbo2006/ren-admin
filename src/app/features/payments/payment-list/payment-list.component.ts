import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { PaymentService } from '../services/payment.service';
import { RentalService } from '../../rentals/services/rental.service';
import { CurrencyMxnPipe } from '../../../shared/pipes/currency-mxn.pipe';
import type { Payment, Rental } from '../../../shared/models';

@Component({
  selector: 'rm-payment-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CurrencyMxnPipe],
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly paymentService = inject(PaymentService);
  readonly rentalService = inject(RentalService);

  readonly payments = this.paymentService.payments;
  readonly summary = this.paymentService.summary;
  readonly loading = this.paymentService.loading;
  readonly rentals = this.rentalService.rentals;

  readonly selectedMethod = signal<string>('');
  readonly isModalOpen = signal(false);
  readonly saving = signal(false);
  readonly selectedRentalForPayment = signal<Rental | null>(null);

  readonly paymentForm: FormGroup = this.fb.group({
    rental_id: [null, [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    payment_date: [new Date().toISOString().split('T')[0], [Validators.required]],
    method: ['transfer', [Validators.required]],
    reference: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.paymentService.loadSummary().subscribe();
    this.paymentService.loadPayments().subscribe();
    this.rentalService.loadRentals({ payment_status: 'unpaid' }).subscribe();

    this.paymentForm.get('rental_id')?.valueChanges.subscribe((rentalId) => {
      if (rentalId) {
        const found = this.rentals().find((r) => r.id === parseInt(rentalId, 10)) || null;
        this.selectedRentalForPayment.set(found);
        if (found && (found.pending_balance_cents || 0) > 0) {
          this.paymentForm.patchValue({
            amount: (found.pending_balance_cents || 0) / 100,
          });
        }
      }
    });
  }

  onFilterChange(): void {
    this.paymentService.loadPayments({
      method: this.selectedMethod() || undefined,
    }).subscribe();
  }

  openPaymentModal(): void {
    this.rentalService.loadRentals().subscribe();
    this.selectedRentalForPayment.set(null);
    this.paymentForm.reset({
      rental_id: null,
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      method: 'transfer',
      reference: '',
      notes: '',
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  payFullBalance(): void {
    const r = this.selectedRentalForPayment();
    if (r) {
      this.paymentForm.patchValue({
        amount: (r.pending_balance_cents || 0) / 100,
      });
    }
  }

  savePayment(): void {
    if (this.paymentForm.invalid || this.saving()) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const fv = this.paymentForm.value;

    const payload = {
      rental_id: parseInt(fv.rental_id, 10),
      amount_cents: Math.round(parseFloat(fv.amount) * 100),
      payment_date: fv.payment_date,
      method: fv.method,
      type: 'income',
      reference: fv.reference || null,
      notes: fv.notes || null,
    };

    this.paymentService.createPayment(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.isModalOpen.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  downloadReceipt(payment: Payment, event: Event): void {
    event.stopPropagation();
    this.paymentService.downloadReceipt(payment.id);
  }

  deletePayment(payment: Payment, event: Event): void {
    event.stopPropagation();
    if (confirm(`¿Estás seguro de eliminar el cobro de ${payment.amount_cents / 100} MXN? Se recalculará el saldo deudor de la renta.`)) {
      this.paymentService.deletePayment(payment.id).subscribe();
    }
  }

  getMethodBadge(method: string): { label: string; class: string } {
    switch (method) {
      case 'cash': return { label: 'Efectivo', class: 'bg-success-subtle text-success' };
      case 'transfer': return { label: 'Transferencia', class: 'bg-primary-subtle text-primary' };
      case 'card': return { label: 'Tarjeta', class: 'bg-info-subtle text-info-emphasis' };
      case 'check': return { label: 'Cheque', class: 'bg-secondary-subtle text-secondary' };
      default: return { label: method, class: 'bg-light text-dark' };
    }
  }
}
