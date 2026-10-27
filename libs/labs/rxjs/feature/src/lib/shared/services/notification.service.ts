// src/app/shared/services/notification.service.ts
import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  toasts = signal<Toast[]>([]);
  private idCounter = 0;

  show(message: string, type: ToastType = 'info', duration = 3000) {
    const id = this.idCounter++;
    const newToast: Toast = { id, message, type };

    this.toasts.update((toasts) => [...toasts, newToast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: number) {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
