import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DispatchStore } from '../../store/dispatch.store';
import * as XLSX from 'xlsx';

@Component({
  selector: 'ah-stock-sheet',
  imports: [CommonModule],
  templateUrl: './stock-sheet.component.html',
  styleUrl: './stock-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockSheetComponent {
  readonly store = inject(DispatchStore);

  getTotal(
    field:
      | 'inCirculation'
      | 'atPlantWash'
      | 'inCleanReserve'
      | 'damagedScrap'
      | 'disputedMissing',
  ): number {
    return this.store
      .stock()
      .reduce((sum, item) => sum + (item[field] || 0), 0);
  }

  exportToExcel(): void {
    const data = this.store.stock().map((item, idx) => ({
      Row: idx + 1,
      SKU: item.sku,
      Name: item.name,
      Category: item.category.toUpperCase(),
      'In Circulation': item.inCirculation,
      'At Subcontractor Wash': item.atPlantWash,
      'Clean Hub Reserve': item.inCleanReserve,
      'Damaged / Scrap': item.damagedScrap,
      'Disputed / Missing': item.disputedMissing,
      'Unit Weight (g)': item.unitWeightGrams,
      'Replacement Cost (£)': item.replacementCostGbp,
      'Total Value (£)':
        (item.inCirculation + item.atPlantWash + item.inCleanReserve) *
        item.replacementCostGbp,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Linen Stock Sheet');
    XLSX.writeFile(workbook, 'PulseOps_London_Linen_Stock.xlsx');
  }
}
