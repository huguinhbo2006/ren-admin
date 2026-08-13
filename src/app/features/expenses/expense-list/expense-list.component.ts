import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ExpenseService } from '../services/expense.service';
import { AssetService } from '../../assets/services/asset.service';
import { CurrencyMxnPipe } from '../../../shared/pipes/currency-mxn.pipe';
import type { Asset, Expense } from '../../../shared/models';

@Component({
  selector: 'rm-expense-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CurrencyMxnPipe],
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly expenseService = inject(ExpenseService);
  readonly assetService = inject(AssetService);

  readonly expenses = this.expenseService.expenses;
  readonly summary = this.expenseService.summary;
  readonly loading = this.expenseService.loading;
  readonly assets = this.assetService.assets;

  readonly selectedType = signal<string>('');
  readonly isModalOpen = signal(false);
  readonly saving = signal(false);
  readonly selectedReceipt = signal<File | null>(null);
  readonly receiptPreview = signal<string | null>(null);

  readonly expenseForm: FormGroup = this.fb.group({
    asset_id: [null],
    category: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.maxLength(255)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    expense_date: [new Date().toISOString().split('T')[0], [Validators.required]],
    vendor: [''],
    type: ['maintenance', [Validators.required]],
  });

  ngOnInit(): void {
    this.expenseService.loadSummary().subscribe();
    this.expenseService.loadExpenses().subscribe();
    this.assetService.loadAssets().subscribe();
  }

  onFilterChange(): void {
    this.expenseService.loadExpenses({
      type: this.selectedType() || undefined,
    }).subscribe();
  }

  openExpenseModal(): void {
    this.selectedReceipt.set(null);
    this.receiptPreview.set(null);
    this.expenseForm.reset({
      asset_id: null,
      category: '',
      description: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      vendor: '',
      type: 'maintenance',
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedReceipt.set(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => this.receiptPreview.set(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        this.receiptPreview.set(null);
      }
    }
  }

  saveExpense(): void {
    if (this.expenseForm.invalid || this.saving()) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const fv = this.expenseForm.value;

    const formData = new FormData();
    if (fv.asset_id) formData.append('asset_id', fv.asset_id);
    formData.append('category', fv.category);
    formData.append('description', fv.description);
    formData.append('amount_cents', Math.round(parseFloat(fv.amount) * 100).toString());
    formData.append('expense_date', fv.expense_date);
    if (fv.vendor) formData.append('vendor', fv.vendor);
    formData.append('type', fv.type);

    const receipt = this.selectedReceipt();
    if (receipt) {
      formData.append('receipt', receipt);
    }

    this.expenseService.createExpense(formData).subscribe({
      next: () => {
        this.saving.set(false);
        this.isModalOpen.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  deleteExpense(expense: Expense, event: Event): void {
    event.stopPropagation();
    if (confirm(`¿Estás seguro de eliminar el gasto "${expense.description}" de ${expense.amount_cents / 100} MXN?`)) {
      this.expenseService.deleteExpense(expense.id).subscribe();
    }
  }

  getTypeBadge(type: string): { label: string; class: string } {
    switch (type) {
      case 'maintenance': return { label: 'Mantenimiento', class: 'bg-info-subtle text-info-emphasis' };
      case 'repair': return { label: 'Reparación', class: 'bg-danger-subtle text-danger' };
      case 'purchase': return { label: 'Adquisición', class: 'bg-primary-subtle text-primary' };
      case 'other': return { label: 'Gasto Operativo', class: 'bg-secondary-subtle text-secondary' };
      default: return { label: type, class: 'bg-light text-dark' };
    }
  }
}
