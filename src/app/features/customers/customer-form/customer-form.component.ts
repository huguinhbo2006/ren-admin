import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../services/customer.service';
import type { Customer } from '../../../shared/models';

@Component({
  selector: 'rm-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly customerId = signal<number | null>(null);
  readonly isEditMode = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly customerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9+() -]{10,20}$')]],
    email: ['', [Validators.email]],
    rfc: ['', [Validators.pattern('^[A-Z&Ñ]{3,4}[0-9]{6}[A-V1-9][A-Z0-9]{2}$')]],
    address: [''],
    notes: [''],
    is_active: [true],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      const id = parseInt(idParam, 10);
      this.customerId.set(id);
      this.isEditMode.set(true);
      this.loadCustomer(id);
    }
  }

  loadCustomer(id: number): void {
    this.loading.set(true);
    this.customerService.getCustomerById(id).subscribe({
      next: (res) => {
        const c = res.data;
        this.customerForm.patchValue({
          name: c.name,
          phone: c.phone,
          email: c.email || '',
          rfc: c.rfc || '',
          address: c.address || '',
          notes: c.notes || '',
          is_active: c.is_active,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('No se pudo cargar la información del cliente.');
      },
    });
  }

  onSubmit(): void {
    if (this.customerForm.invalid || this.saving()) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const fv = this.customerForm.value;
    const payload: Partial<Customer> = {
      name: fv.name,
      phone: fv.phone,
      email: fv.email || null,
      rfc: fv.rfc ? fv.rfc.toUpperCase() : null,
      address: fv.address || null,
      notes: fv.notes || null,
      is_active: fv.is_active,
    };

    const action$ = this.isEditMode() && this.customerId()
      ? this.customerService.updateCustomer(this.customerId()!, payload)
      : this.customerService.createCustomer(payload);

    action$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/customers']);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(
          err.error?.message || 'Error al guardar los datos del cliente.'
        );
      },
    });
  }
}
