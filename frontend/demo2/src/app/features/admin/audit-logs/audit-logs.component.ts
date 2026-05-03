import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AuditLog } from '../../../core/models/audit-log.model';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatTableModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, FormsModule,
  ],
  templateUrl: './audit-logs.component.html',
})
export class AuditLogsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  logs: AuditLog[] = [];
  filtered: AuditLog[] = [];
  loading = true;
  searchText = '';
  displayedColumns = ['id', 'action', 'entityType', 'entityId', 'performedBy', 'timestamp'];

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.admin.getAuditLogs(0, 100).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page: { content: AuditLog[] }) => {
        this.logs = page.content;
        this.filtered = this.logs;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  applySearch(): void {
    const q = this.searchText.toLowerCase();
    this.filtered = this.logs.filter(
      (l) =>
        l.action?.toLowerCase().includes(q) ||
        l.entityType?.toLowerCase().includes(q) ||
        l.performedBy?.toLowerCase().includes(q)
    );
  }
}
