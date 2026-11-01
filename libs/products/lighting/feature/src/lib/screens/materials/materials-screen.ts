import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AhButton, AhSegmentedControl } from '@ah/ui';
import {
  type MaterialItem,
  PUBLIC_MATERIALS_CATALOG,
} from '@ah/products/lighting/domain';
import { artKind, MaterialArt } from '../../diagrams/material-art/material-art';
import { PoleAnatomy } from '../../diagrams/pole-anatomy/pole-anatomy';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { isSolarPole, LightingStore } from '../../store/lighting.store';

type View = 'catalog' | 'bom';
type Category = MaterialItem['category'] | 'all';
export type BomLine =
  | 'pole'
  | 'luminaire'
  | 'anchors'
  | 'panel'
  | 'battery'
  | 'controller'
  | 'cable';

interface Line {
  id: BomLine;
  quantity: number;
  unit: 'pcs' | 'm';
  unitPrice: number;
}

/** The supplier catalogue, and a bill of materials for the active project. */
@Component({
  selector: 'lp-materials-screen',
  imports: [AhButton, AhSegmentedControl, MaterialArt, PoleAnatomy],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './materials-screen.html',
  styleUrl: './materials-screen.scss',
})
export class MaterialsScreen {
  protected readonly store = inject(LightingStore);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;

  protected readonly artKind = artKind;
  protected readonly view = signal<View>('catalog');
  protected readonly views = computed(() =>
    (['catalog', 'bom'] as const).map((value) => ({
      value,
      label: this.t().materials.views[value],
    })),
  );
  protected readonly query = signal('');
  protected readonly category = signal<Category>('all');
  protected readonly categories = computed(() =>
    (
      [
        'all',
        'pole',
        'luminaire',
        'solar_panel',
        'battery',
        'anchor_bolts',
        'cable',
      ] as const
    ).map((value) => ({ value, label: this.t().materials.categories[value] })),
  );

  protected readonly items = computed(() => {
    const q = this.query().trim().toLowerCase();
    const category = this.category();
    return PUBLIC_MATERIALS_CATALOG.filter(
      (m) =>
        (category === 'all' || m.category === category) &&
        (!q ||
          `${m.name} ${m.manufacturer} ${m.specsSummary}`
            .toLowerCase()
            .includes(q)),
    );
  });

  /** Quantities from the project's poles; unit prices are indicative (€ excl. VAT). */
  protected readonly lines = computed<Line[]>(() => {
    const poles = this.store.activeProject()?.poles ?? [];
    const solar = poles.filter(isSolarPole).length;
    const grid = poles.length - solar;
    const lines: Line[] = [
      { id: 'pole', quantity: poles.length, unit: 'pcs', unitPrice: 380 },
      { id: 'luminaire', quantity: poles.length, unit: 'pcs', unitPrice: 210 },
      { id: 'anchors', quantity: poles.length, unit: 'pcs', unitPrice: 65 },
    ];
    if (solar > 0) {
      lines.push(
        { id: 'panel', quantity: solar, unit: 'pcs', unitPrice: 140 },
        { id: 'battery', quantity: solar, unit: 'pcs', unitPrice: 290 },
        { id: 'controller', quantity: solar, unit: 'pcs', unitPrice: 85 },
      );
    }
    if (grid > 0) {
      // About 30 m of cable per grid-fed pole.
      lines.push({
        id: 'cable',
        quantity: grid * 30,
        unit: 'm',
        unitPrice: 3.5,
      });
    }
    return lines.filter((line) => line.quantity > 0);
  });

  protected readonly total = computed(() =>
    this.lines().reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
  );

  protected exportCsv(): void {
    const t = this.t().materials;
    const cell = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;
    const rows = [
      [t.item, t.spec, t.quantity, t.unitPrice, t.lineTotal]
        .map(cell)
        .join(','),
      ...this.lines().map((line) =>
        [
          t.bom[line.id].name,
          t.bom[line.id].spec,
          line.quantity,
          line.unitPrice,
          line.quantity * line.unitPrice,
        ]
          .map(cell)
          .join(','),
      ),
      ['', '', '', t.total, this.total()].map(cell).join(','),
    ];
    // The byte-order mark makes Excel read the accents and Arabic correctly.
    const blob = new Blob(['\uFEFF' + rows.join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luxpath-bom-${this.store.activeProject()?.id ?? 'project'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
