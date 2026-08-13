import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SettingService } from '../services/setting.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'rm-upgrade',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradeComponent implements OnInit {
  readonly settingService = inject(SettingService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly upgrading = signal(false);
  readonly planUsage = this.settingService.planUsage;

  ngOnInit(): void {
    this.settingService.loadPlanUsage().subscribe();
  }

  confirmUpgrade(): void {
    this.upgrading.set(true);
    this.settingService.subscribeToPlan('pro').subscribe({
      next: () => {
        this.authService.me().subscribe({
          next: () => {
            this.upgrading.set(false);
            this.router.navigate(['/settings']);
          },
        });
      },
      error: () => {
        this.upgrading.set(false);
      },
    });
  }
}
