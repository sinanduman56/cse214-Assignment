import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal<boolean>(localStorage.getItem('theme') === 'dark');

  constructor() {
    // Apply saved theme immediately
    this.apply(this.isDark());

    effect(() => {
      this.apply(this.isDark());
      localStorage.setItem('theme', this.isDark() ? 'dark' : 'light');
    });
  }

  private apply(dark: boolean): void {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  toggle(): void {
    this.isDark.update(v => !v);
  }
}
