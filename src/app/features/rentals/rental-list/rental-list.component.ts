import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RentalService } from '../services/rental.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CurrencyMxnPipe } from '../../../shared/pipes/currency-mxn.pipe';
import type { Rental } from '../../../shared/models';

@Component({
  selector: 'rm-rental-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyMxnPipe],
  templateUrl: './rental-list.component.html',
  styleUrls: ['./rental-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentalListComponent implements OnInit {
  readonly rentalService = inject(RentalService);
  readonly authService = inject(AuthService);

  readonly selectedStatus = signal<string>('');
  readonly selectedPaymentStatus = signal<string>('');
  readonly selectedRental = signal<Rental | null>(null);

  readonly rentals = this.rentalService.rentals;
  readonly loading = this.rentalService.loading;
  readonly currentUser = this.authService.currentUser;

  ngOnInit(): void {
    this.fetchRentals();
  }

  fetchRentals(): void {
    this.rentalService.loadRentals({
      status: this.selectedStatus() || undefined,
      payment_status: this.selectedPaymentStatus() || undefined,
    }).subscribe();
  }

  onFilterChange(): void {
    this.fetchRentals();
  }

  openDetail(rental: Rental): void {
    this.selectedRental.set(rental);
  }

  closeDetail(): void {
    this.selectedRental.set(null);
  }

  completeRental(rental: Rental, event: Event): void {
    event.stopPropagation();
    if (confirm(`¿Confirmas la recepción y devolución del activo para el contrato ${rental.folio}?`)) {
      this.rentalService.completeRental(rental.id).subscribe();
    }
  }

  cancelRental(rental: Rental, event: Event): void {
    event.stopPropagation();
    if (confirm(`¿Estás seguro de cancelar la renta ${rental.folio}? El activo quedará disponible nuevamente.`)) {
      this.rentalService.cancelRental(rental.id).subscribe();
    }
  }

  downloadPdf(rental: Rental, event: Event): void {
    event.stopPropagation();
    this.rentalService.downloadPdf(rental.id, rental.folio);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-success-subtle text-success';
      case 'completed': return 'bg-primary-subtle text-primary';
      case 'cancelled': return 'bg-secondary-subtle text-secondary';
      default: return 'bg-warning-subtle text-warning-emphasis';
    }
  }

  getPaymentClass(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'paid': return 'bg-success-subtle text-success';
      case 'partial': return 'bg-warning-subtle text-warning-emphasis';
      default: return 'bg-danger-subtle text-danger';
    }
  }
}
