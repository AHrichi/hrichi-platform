// src/app/shared/services/user-data.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' },
  ];

  getUser(id: number): Observable<User | undefined> {
    const user = this.users.find((u) => u.id === id);

    // Simulate a network request with a 1-second delay
    return of(user).pipe(
      tap(() =>
        console.log(`--- Faking network request for User ID: ${id} ---`),
      ),
      delay(1000),
    );
  }
}
