import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinancialStore, Goal } from '../../financial.store';
import { TransactionLedgerComponent } from '../../components/transaction-ledger/transaction-ledger.component';

@Component({
  selector: 'app-ledger-page',
  standalone: true,
  imports: [CommonModule, TransactionLedgerComponent],
  template: `
    <div class="ledger-page-container">
      <div class="ledger-wrapper">
        <app-transaction-ledger
          [transactions]="store.transactions()"
          [currentBalance]="store.currentBalance()"
          [accounts]="store.accounts()"
          [categories]="store.categories()"
          [goals]="allGoals()"
          (addTransaction)="handleAddTransaction($event)"
          (updateTransaction)="store.updateTransaction($event.id, $event.data)"
          (removeTransaction)="store.removeTransaction($event)"
          (addAccount)="
            store.addAccount($event.name, $event.type, $event.initialBalance)
          "
          (removeAccount)="store.removeAccount($event)"
          (addCategory)="store.addCategory($event)"
          (removeCategory)="store.removeCategory($event)"
          (updateCategory)="store.updateCategory($event.id, $event.data)"
          (bulkImport)="store.bulkImportData($event)"
        ></app-transaction-ledger>
      </div>
    </div>
  `,
  styles: [
    `
      .ledger-page-container {
        padding: 24px 0;
        display: flex;
        justify-content: center;
      }
      .ledger-wrapper {
        width: 100%;
        max-width: 900px;
      }
    `,
  ],
})
export class LedgerPageComponent {
  store = inject(FinancialStore);

  allGoals = computed(() => {
    const seen = new Set<string>();
    const result: Goal[] = [];
    for (const s of this.store.scenarios()) {
      for (const g of s.goals || []) {
        if (!seen.has(g.name)) {
          seen.add(g.name);
          result.push({ ...g });
        }
      }
    }
    return result;
  });

  handleAddTransaction(txn: any) {
    const prevAchieved = this.store
      .realityGoalProgress()
      .filter((g) => g.status === 'achieved').length;
    this.store.addTransaction(txn);

    setTimeout(() => {
      const newAchieved = this.store
        .realityGoalProgress()
        .filter((g) => g.status === 'achieved').length;
      if (newAchieved > prevAchieved) {
        this.triggerConfetti();
      }
    }, 50);
  }

  triggerConfetti() {
    import('canvas-confetti').then((confetti) => {
      confetti.default({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
    });
  }
}
