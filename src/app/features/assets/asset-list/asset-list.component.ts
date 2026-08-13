import { Component, OnInit, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../services/asset.service';
import { AssetCategoryService } from '../services/asset-category.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CurrencyMxnPipe } from '../../../shared/pipes/currency-mxn.pipe';
import type { Asset, AssetCategory } from '../../../shared/models';

@Component({
  selector: 'rm-asset-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyMxnPipe],
  templateUrl: './asset-list.component.html',
  styleUrls: ['./asset-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetListComponent implements OnInit {
  readonly assetService = inject(AssetService);
  readonly categoryService = inject(AssetCategoryService);
  readonly authService = inject(AuthService);

  readonly searchTerm = signal('');
  readonly selectedCategory = signal<string>('');
  readonly selectedStatus = signal<string>('');
  readonly selectedAsset = signal<Asset | null>(null);

  readonly assets = this.assetService.assets;
  readonly loading = this.assetService.loading;
  readonly categories = this.categoryService.categories;
  readonly currentUser = this.authService.currentUser;

  readonly isFreePlan = computed(() => this.authService.planSlug() === 'free');
  readonly assetCount = computed(() => this.assets().length);
  readonly maxAssets = computed(() => this.isFreePlan() ? 3 : Infinity);
  readonly limitReached = computed(() => this.isFreePlan() && this.assetCount() >= 3);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.categoryService.loadCategories().subscribe();
    this.fetchAssets();
  }

  fetchAssets(): void {
    this.assetService.loadAssets({
      search: this.searchTerm() || undefined,
      category_id: this.selectedCategory() || undefined,
      status: this.selectedStatus() || undefined,
    }).subscribe();
  }

  onSearchChange(val: string): void {
    this.searchTerm.set(val);
    this.fetchAssets();
  }

  onFilterChange(): void {
    this.fetchAssets();
  }

  openDetailModal(asset: Asset): void {
    this.selectedAsset.set(asset);
  }

  closeDetailModal(): void {
    this.selectedAsset.set(null);
  }

  deleteAsset(asset: Asset, event: Event): void {
    event.stopPropagation();
    if (confirm(`¿Estás seguro de eliminar el activo "${asset.name}"?`)) {
      this.assetService.deleteAsset(asset.id).subscribe();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'available': return 'available';
      case 'rented': return 'rented';
      case 'maintenance': return 'maintenance';
      default: return 'inactive';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'available': return 'Disponible';
      case 'rented': return 'En Renta';
      case 'maintenance': return 'Mantenimiento';
      default: return 'Inactivo';
    }
  }
}
