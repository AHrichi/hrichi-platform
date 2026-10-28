import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinancialStore, Goal, Transaction } from '../../financial.store';
import { TransactionLedgerComponent } from '../../components/transaction-ledger/transaction-ledger.component';

@Component({
  selector: 'app-ledger-page',
  standalone: true,
  imports: [CommonModule, TransactionLedgerComponent],
  templateUrl: './ledger-page.component.html',
  styleUrl: './ledger-page.component.scss',
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

  handleAddTransaction(txn: Omit<Transaction, 'id'>) {
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
