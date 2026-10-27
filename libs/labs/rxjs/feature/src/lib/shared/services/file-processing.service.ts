// src/app/shared/services/file-processing.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface File {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class FileProcessingService {
  processFile(file: File): Observable<string> {
    const processingTime = Math.random() * 1000 + 500; // Random delay between 0.5s and 1.5s
    return of(`Processed ${file.name}`).pipe(delay(processingTime));
  }
}
