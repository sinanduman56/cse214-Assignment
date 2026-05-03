import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { Store } from '../../../core/models/store.model';

@Component({
  selector: 'app-store-management',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatTableModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './store-management.component.html',
})
export class StoreManagementComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  stores: Store[] = [];
  loading = true;
  displayedColumns = ['id', 'name', 'owner', 'status', 'actions'];

  constructor(private admin: AdminService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.admin.getAllStores().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (s) => { this.stores = s; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  closeStore(store: Store): void {
    this.admin.closeStore(store.id).subscribe(() => {
      store.active = false;
      this.snack.open('Mağaza kapatıldı', 'Tamam', { duration: 2500 });
    });
  }

  openStore(store: Store): void {
    this.admin.openStore(store.id).subscribe(() => {
      store.active = true;
      this.snack.open('Mağaza açıldı', 'Tamam', { duration: 2500 });
    });
  }
}
