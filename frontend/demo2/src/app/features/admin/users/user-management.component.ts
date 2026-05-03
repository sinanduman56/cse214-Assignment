import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatTableModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule,
  ],
  templateUrl: './user-management.component.html',
})
export class UserManagementComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  users: User[] = [];
  loading = true;
  displayedColumns = ['id', 'email', 'role', 'status', 'actions'];

  constructor(private admin: AdminService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.admin.getAllUsers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (u) => { this.users = u; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  suspend(user: User): void {
    this.admin.suspendUser(user.id).subscribe(() => {
      user.active = false;
      this.snack.open('Kullanıcı askıya alındı', 'Tamam', { duration: 2500 });
    });
  }

  activate(user: User): void {
    this.admin.activateUser(user.id).subscribe(() => {
      user.active = true;
      this.snack.open('Kullanıcı aktifleştirildi', 'Tamam', { duration: 2500 });
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`${user.email} silinsin mi?`)) return;
    this.admin.deleteUser(user.id).subscribe(() => {
      this.users = this.users.filter((u) => u.id !== user.id);
      this.snack.open('Kullanıcı silindi', 'Tamam', { duration: 2500 });
    });
  }
}
