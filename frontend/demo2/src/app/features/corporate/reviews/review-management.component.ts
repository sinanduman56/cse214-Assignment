import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { switchMap } from 'rxjs/operators';
import { ReviewService } from '../../../core/services/review.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/services/auth.service';
import { Review } from '../../../core/models/review.model';

@Component({
  selector: 'app-review-management',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule,
    MatTableModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './review-management.component.html',
})
export class ReviewManagementComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  reviews: Review[] = [];
  loading = true;
  error = '';
  displayedColumns = ['product', 'user', 'rating', 'comment', 'date', 'actions'];

  constructor(
    private reviewService: ReviewService,
    private storeService: StoreService,
    private auth: AuthService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const userId = this.auth.userId();
    if (!userId) { this.loading = false; this.error = 'Oturum bilgisi alınamadı.'; return; }

    this.storeService.getByOwner(userId)
      .pipe(
        switchMap(stores => {
          if (!stores?.length) throw new Error('Mağaza bulunamadı.');
          return this.reviewService.getByStore(stores[0].id);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (r) => { this.reviews = r; this.loading = false; },
        error: (e) => { this.error = e?.message ?? 'Yorumlar yüklenemedi.'; this.loading = false; },
      });
  }

  deleteReview(id: number): void {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    this.reviewService.delete(id).subscribe(() => {
      this.reviews = this.reviews.filter((r) => r.id !== id);
      this.snack.open('Yorum silindi', 'Tamam', { duration: 2500 });
    });
  }

  stars(n: number): number[] {
    return Array(n).fill(0);
  }
}
