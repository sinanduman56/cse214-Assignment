import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    roleType: ['individual', Validators.required],
    gender: ['', Validators.required],
  });

  loading = false;
  hidePassword = true;

  constructor() {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.register(this.form.getRawValue()).subscribe({
      next: (res) => {
        const role = res.roleType.toLowerCase();
        if (role === 'admin') this.router.navigate(['/admin/dashboard']);
        else if (role === 'corporate') this.router.navigate(['/corporate/dashboard']);
        else this.router.navigate(['/customer/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.snack.open(err?.error?.message ?? 'Kayıt başarısız.', 'Kapat', { duration: 4000 });
      },
    });
  }
}
