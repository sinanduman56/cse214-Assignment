import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatTableModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './category-management.component.html',
})
export class CategoryManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  categories: Category[] = [];
  loading = true;
  editingId: number | null = null;
  displayedColumns = ['id', 'name', 'actions'];

  form = this.fb.group({
    name: ['', Validators.required],
  });

  editForm = this.fb.group({
    name: ['', Validators.required],
  });

  constructor() {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (c) => { this.categories = c; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  addCategory(): void {
    if (this.form.invalid) return;
    this.categoryService.create({ name: this.form.value.name! }).subscribe((c) => {
      this.categories = [...this.categories, c];
      this.form.reset();
      this.snack.open('Kategori eklendi', 'Tamam', { duration: 2500 });
    });
  }

  startEdit(cat: Category): void {
    this.editingId = cat.id;
    this.editForm.patchValue({ name: cat.name });
  }

  saveEdit(cat: Category): void {
    if (this.editForm.invalid) return;
    this.categoryService.update(cat.id, { name: this.editForm.value.name! }).subscribe((updated) => {
      this.categories = this.categories.map((c) => (c.id === cat.id ? updated : c));
      this.editingId = null;
      this.snack.open('Kategori güncellendi', 'Tamam', { duration: 2500 });
    });
  }

  deleteCategory(cat: Category): void {
    if (!confirm(`"${cat.name}" silinsin mi?`)) return;
    this.categoryService.delete(cat.id).subscribe(() => {
      this.categories = this.categories.filter((c) => c.id !== cat.id);
      this.snack.open('Kategori silindi', 'Tamam', { duration: 2500 });
    });
  }
}
