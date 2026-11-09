import { Component, inject } from '@angular/core';
import { AhButton } from '@ah/ui';
import { injectRxjsLabCopy } from '../../../i18n/rxjs-lab-copy';
import { DataSharingService } from '../../../shared/services/data-sharing.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-service-sender',
  standalone: true,
  imports: [AhButton],
  templateUrl: './service-sender.component.html',
  styleUrls: ['./service-sender.component.scss'],
})
export class ServiceSenderComponent {
  readonly copy = injectRxjsLabCopy();
  private dataService = inject(DataSharingService);
  private notificationService = inject(NotificationService);

  sendData() {
    const data = `Message #${Math.floor(Math.random() * 100)}`;
    this.dataService.sendData(data);
    this.notificationService.show(`Sent "${data}" via service`, 'info');
  }
}
