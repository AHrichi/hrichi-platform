import { Component, inject } from '@angular/core';
import { DataSharingService } from '../../../shared/services/data-sharing.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-service-sender',
  standalone: true,
  templateUrl: './service-sender.component.html',
  styleUrls: ['./service-sender.component.scss'],
})
export class ServiceSenderComponent {
  private dataService = inject(DataSharingService);
  private notificationService = inject(NotificationService);

  sendData() {
    const data = `Message #${Math.floor(Math.random() * 100)}`;
    this.dataService.sendData(data);
    this.notificationService.show(`Sent "${data}" via service`, 'info');
  }
}
