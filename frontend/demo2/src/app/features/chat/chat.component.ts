import { Component, inject, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChatService, ChartData, GuardrailInfo } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  chartData?: ChartData | null;
  guardrailInfo?: GuardrailInfo | null;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule,
    BaseChartDirective,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  private fb = inject(FormBuilder);
  private chatService = inject(ChatService);
  public auth = inject(AuthService);

  messages: ChatMessage[] = [];
  loading = false;
  private shouldScroll = false;

  readonly suggestedQuestions = [
    'Son 3 ayda hangi kategorilerden alışveriş yaptım?',
    'Toplam ne kadar harcadım?',
    'Kaç siparişim var?',
    'En yüksek puanladığım ürünler hangileri?',
  ];

  readonly storeOwnerQuestions = [
    'En çok satan ürünlerim hangileri?',
    'Kategori bazlı satış dağılımım nasıl?',
    'Bu ayki toplam satışım ne kadar?',
    'Hangi ürünlerime daha fazla yorum yapılmış?',
  ];

  readonly adminQuestions = [
    'Platformdaki toplam sipariş ve gelir ne kadar?',
    'Hangi mağaza en fazla satış yapıyor?',
    'Aktif kullanıcı ve mağaza sayısı kaç?',
    'En çok satılan ürün kategorisi hangisi?',
    'Son dönemde kaç yeni kullanıcı kayıt oldu?',
    'Hangi mağazanın müşteri memnuniyeti en yüksek?',
  ];

  form = this.fb.group({
    message: ['', Validators.required],
  });

  constructor() {
    const role = this.auth.userRole ? this.auth.userRole() : null;
    const isAdmin = role === 'ADMIN' || role === 'admin';
    const isStore = role === 'STORE_OWNER' || role === 'corporate';

    const greeting = isAdmin
      ? 'Merhaba Admin! 👋 Platform genelinde analiz yapmanıza yardımcı olabilirim.\n\nMağaza karşılaştırmaları, kullanıcı istatistikleri, gelir raporları ve daha fazlası için soru sorabilirsiniz.'
      : isStore
      ? 'Merhaba! 👋 Mağazanız hakkında size yardımcı olabilirim.\n\nSatışlarınız, ürünleriniz veya müşteri yorumları hakkında soru sorabilirsiniz. Grafik gerektiren sorularda otomatik görselleştirme yapılır.'
      : 'Merhaba! 👋 Size nasıl yardımcı olabilirim?\n\nSiparişleriniz, harcamalarınız veya ürünler hakkında soru sorabilirsiniz. Grafik gerektiren sorularda otomatik olarak görselleştirme yapılır.';

    this.messages.push({ role: 'assistant', content: greeting });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  send(text?: string): void {
    const msg = text || this.form.value.message?.trim();
    if (!msg || this.loading) return;

    this.messages.push({ role: 'user', content: msg });
    this.form.reset();
    this.loading = true;
    this.shouldScroll = true;

    const role = (this.auth.userRole ? this.auth.userRole() : null) ?? undefined;
    this.chatService.ask(msg, this.auth.userId(), role).subscribe({
      next: (res) => {
        this.messages.push({
          role: 'assistant',
          content: res.answer ?? res.response ?? 'Yanıt alınamadı.',
          chartData: res.chart_data,
          guardrailInfo: res.guardrail_info,
        });
        this.loading = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: '⚠️ Bir hata oluştu. Lütfen tekrar deneyin.' });
        this.loading = false;
        this.shouldScroll = true;
      },
    });
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  buildChartConfig(chartData: ChartData): ChartConfiguration {
    const darkColors = [
      '#7c3aed','#4f46e5','#0ea5e9','#06b6d4','#10b981',
      '#f59e0b','#ef4444','#ec4899','#8b5cf6','#6366f1',
    ];
    const isLine = chartData.type === 'line';
    const isPie  = chartData.type === 'pie' || chartData.type === 'doughnut';

    return {
      type: chartData.type as any,
      data: {
        labels: chartData.labels,
        datasets: chartData.datasets.map((ds, i) => ({
          ...ds,
          backgroundColor: ds.backgroundColor ||
            (isPie ? darkColors : darkColors[i % darkColors.length] + '99'),
          borderColor: ds.backgroundColor ||
            (isLine ? '#7c3aed' : darkColors[i % darkColors.length]),
          tension: isLine ? 0.4 : undefined,
          fill: isLine ? false : undefined,
          borderWidth: isLine ? 2.5 : (isPie ? 2 : 0),
          pointBackgroundColor: isLine ? '#7c3aed' : undefined,
          pointRadius: isLine ? 4 : undefined,
          borderRadius: (!isLine && !isPie) ? 6 : undefined,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: {
            position: isPie ? 'right' : 'top',
            labels: {
              color: '#94a3b8',
              font: { size: 11 },
              padding: 14,
              boxWidth: 12,
            },
          },
          title: { display: false },
          tooltip: {
            backgroundColor: '#1e1b4b',
            titleColor: '#c4b5fd',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(99,102,241,0.3)',
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: (!isLine && !isPie) ? {
          x: {
            ticks: { color: '#64748b', font: { size: 11 } },
            grid: { color: 'rgba(99,102,241,0.1)' },
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#64748b', font: { size: 11 } },
            grid: { color: 'rgba(99,102,241,0.1)' },
          },
        } : isLine ? {
          x: {
            ticks: { color: '#64748b', font: { size: 11 } },
            grid: { color: 'rgba(99,102,241,0.1)' },
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#64748b', font: { size: 11 } },
            grid: { color: 'rgba(99,102,241,0.1)' },
          },
        } : undefined,
      },
    };
  }

  isStoreOwner(): boolean {
    const role = this.auth.userRole ? this.auth.userRole() : null;
    return role === 'STORE_OWNER' || role === 'corporate';
  }

  isAdmin(): boolean {
    const role = this.auth.userRole ? this.auth.userRole() : null;
    return role === 'ADMIN' || role === 'admin';
  }
}
