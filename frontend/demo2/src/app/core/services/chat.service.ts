import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GuardrailInfo {
  detected: boolean;
  detection_type: string;
  keyword: string | null;
  action: string;
  alternative: string;
}

export interface ChatResponse {
  success: boolean;
  answer?: string;
  response?: string;
  chart_data?: ChartData | null;
  guardrail_info?: GuardrailInfo | null;
  error?: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
  }[];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly API = 'http://localhost:8080/api/chat';

  constructor(private http: HttpClient) {}

  ask(message: string, userId?: number | null, userRole?: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.API}/ask`, {
      message,
      userId,
      userRole: userRole || 'CUSTOMER',
    });
  }
}
