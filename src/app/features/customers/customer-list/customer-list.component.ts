import { Component, OnInit, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService, CustomerStatement } from '../services/customer.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CurrencyMxnPipe } from '../../../shared/pipes/currency-mxn.pipe';
import type { Customer } from '../../../shared/models';

@Component({
  selector: 'rm-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyMxnPipe],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerListComponent implements OnInit {
  readonly customerService = inject(CustomerService);
  readonly authService = inject(AuthService);

  readonly searchTerm = signal('');
  readonly selectedStatus = signal<string>('');
  readonly selectedStatement = signal<CustomerStatement | null>(null);
  readonly loadingStatement = signal(false);

  readonly customers = this.customerService.customers;
  readonly loading = this.customerService.loading;
  readonly currentUser = this.authService.currentUser;

  readonly isFreePlan = computed(() => this.authService.planSlug() === 'free');
  readonly customerCount = computed(() => this.customers().length);
  readonly maxCustomers = computed(() => this.isFreePlan() ? 10 : Infinity);
  readonly limitReached = computed(() => this.isFreePlan() && this.customerCount() >= 10);

  ngOnInit(): void {
    this.fetchCustomers();
  }

  fetchCustomers(): void {
    const isActiveParam = this.selectedStatus() !== '' ? this.selectedStatus() === 'true' : undefined;
    this.customerService.loadCustomers({
      search: this.searchTerm() || undefined,
      is_active: isActiveParam,
    }).subscribe();
  }

  onSearchChange(val: string): void {
    this.searchTerm.set(val);
    this.fetchCustomers();
  }

  onStatusChange(): void {
    this.fetchCustomers();
  }

  openStatement(customer: Customer): void {
    this.loadingStatement.set(true);
    this.customerService.getCustomerStatement(customer.id).subscribe({
      next: (res) => {
        this.selectedStatement.set(res.data);
        this.loadingStatement.set(false);
      },
      error: () => {
        this.loadingStatement.set(false);
      },
    });
  }

  closeStatement(): void {
    this.selectedStatement.set(null);
  }

  deleteCustomer(customer: Customer, event: Event): void {
    event.stopPropagation();
    if (confirm(`¿Estás seguro de eliminar al cliente "${customer.name}"?`)) {
      this.customerService.deleteCustomer(customer.id).subscribe();
    }
  }

  getCleanPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 ? `52${digits}` : digits;
  }
}
