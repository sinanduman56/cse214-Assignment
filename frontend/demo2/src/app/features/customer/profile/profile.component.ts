import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatDividerModule, MatSnackBarModule,
  ],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  public auth = inject(AuthService);
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);

  form = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }],
    roleType: [{ value: '', disabled: true }],
    gender: ['', Validators.required],
  });

  passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  saving = false;

  constructor() {}

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({ email: user.email, roleType: user.roleType });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const userId = this.auth.userId()!;
    this.http.put(`http://localhost:8080/api/users/${userId}`, { gender: this.form.getRawValue().gender }).subscribe({
      next: () => { this.saving = false; this.snack.open('Profil güncellendi!', 'Tamam', { duration: 2500 }); },
      error: () => { this.saving = false; this.snack.open('Güncelleme başarısız', 'Kapat', { duration: 3000 }); },
    });
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = { individual: 'Bireysel', corporate: 'Kurumsal', admin: 'Admin' };
    return map[role?.toLowerCase()] ?? role;
  }
}
