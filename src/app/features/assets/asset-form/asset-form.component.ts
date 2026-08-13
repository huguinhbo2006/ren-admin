import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AssetService } from '../services/asset.service';
import { AssetCategoryService } from '../services/asset-category.service';
import type { Asset, AssetCategory } from '../../../shared/models';

@Component({
  selector: 'rm-asset-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './asset-form.component.html',
  styleUrls: ['./asset-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assetService = inject(AssetService);
  private readonly categoryService = inject(AssetCategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly assetId = signal<number | null>(null);
  readonly isEditMode = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly categories = this.categoryService.categories;
  readonly uploadedPhotos = signal<string[]>([]);
  readonly pendingFile = signal<File | null>(null);
  readonly photoPreview = signal<string | null>(null);

  readonly assetForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    category_id: [null],
    serial_number: [''],
    daily_rate: [0, [Validators.required, Validators.min(0)]],
    weekly_rate: [0, [Validators.min(0)]],
    monthly_rate: [0, [Validators.min(0)]],
    deposit: [0, [Validators.min(0)]],
    status: ['available', [Validators.required]],
    location: [''],
    description: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.categoryService.loadCategories().subscribe();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      const id = parseInt(idParam, 10);
      this.assetId.set(id);
      this.isEditMode.set(true);
      this.loadAsset(id);
    }
  }

  loadAsset(id: number): void {
    this.loading.set(true);
    this.assetService.getAssetById(id).subscribe({
      next: (res) => {
        const asset = res.data;
        this.uploadedPhotos.set(asset.images || []);
        this.assetForm.patchValue({
          name: asset.name,
          category_id: asset.category_id,
          serial_number: asset.serial_number,
          daily_rate: asset.daily_rate_cents / 100,
          weekly_rate: (asset.weekly_rate_cents || 0) / 100,
          monthly_rate: (asset.monthly_rate_cents || 0) / 100,
          deposit: (asset.deposit_cents || 0) / 100,
          status: asset.status,
          location: asset.location,
          description: asset.description,
          notes: asset.notes,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('No se pudo cargar la información del activo.');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.pendingFile.set(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.assetForm.invalid || this.saving()) {
      this.assetForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const fv = this.assetForm.value;
    const payload: Partial<Asset> = {
      name: fv.name,
      category_id: fv.category_id ? parseInt(fv.category_id, 10) : null,
      serial_number: fv.serial_number || null,
      daily_rate_cents: Math.round(parseFloat(fv.daily_rate) * 100),
      weekly_rate_cents: Math.round(parseFloat(fv.weekly_rate || 0) * 100),
      monthly_rate_cents: Math.round(parseFloat(fv.monthly_rate || 0) * 100),
      deposit_cents: Math.round(parseFloat(fv.deposit || 0) * 100),
      status: fv.status,
      location: fv.location || null,
      description: fv.description || null,
      notes: fv.notes || null,
    };

    const action$ = this.isEditMode() && this.assetId()
      ? this.assetService.updateAsset(this.assetId()!, payload)
      : this.assetService.createAsset(payload);

    action$.subscribe({
      next: (res) => {
        const savedAsset = res.data;
        const file = this.pendingFile();

        if (file && savedAsset.id) {
          this.assetService.uploadPhoto(savedAsset.id, file).subscribe({
            next: () => {
              this.saving.set(false);
              this.router.navigate(['/assets']);
            },
            error: () => {
              this.saving.set(false);
              this.router.navigate(['/assets']);
            },
          });
        } else {
          this.saving.set(false);
          this.router.navigate(['/assets']);
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(
          err.error?.message || 'Error al guardar los datos del activo.'
        );
      },
    });
  }
}
