import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { injectRxjsLabCopy } from '../../../i18n/rxjs-lab-copy';
import { DataSharingService } from '../../../shared/services/data-sharing.service';

@Component({
  selector: 'app-service-receiver',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './service-receiver.component.html',
  styleUrls: ['./service-receiver.component.scss'],
})
export class ServiceReceiverComponent {
  readonly copy = injectRxjsLabCopy();
  dataService = inject(DataSharingService);
}
