import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = false;
  hidePassword = true;

  constructor() {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const { email, password } = this.form.getRawValue();
    this.auth.login({ email, password }).subscribe({
      next: (res) => {
        this.loading = false;
        const role = res.roleType.toLowerCase();
        if (role === 'admin') this.router.navigate(['/admin/dashboard']);
        else if (role === 'corporate' || role === 'store_owner') this.router.navigate(['/corporate/dashboard']);
        else this.router.navigate(['/customer/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.snack.open(err?.error?.message ?? 'Giriş başarısız. Bilgilerinizi kontrol edin.', 'Kapat', { duration: 4000 });
      },
    });
  }
}
