import type { SiteLanguage } from '@ah/shared/state';

export interface ConstellationCopy {
  summaryTitle: string;
  summaryBody: (projects: number, dependencies: number) => string;
  hint: string;
  spin: string;
  addPart: string;
  removePart: string;
  reset: string;
  filters: {
    all: string;
    apps: string;
    libs: string;
    e2e: string;
    edges: string;
    stars: string;
  };
  addedNotice: (name: string) => string;
  removedNotice: (name: string) => string;
  resetNotice: string;
  fullscreenAria: string;
}

export const CONSTELLATION_COPY: Record<SiteLanguage, ConstellationCopy> = {
  en: {
    summaryTitle: "This site's real Nx graph:",
    summaryBody: (p, d) =>
      `${p} projects and ${d} dependencies, exported from the repository at build time. Drag to spin 360°, or click any project to open it.`,
    hint: 'Drag or swipe to spin in 3D · Pinch or scroll to zoom · Click to inspect',
    spin: 'Spin 360°',
    addPart: '+ Add Part',
    removePart: '− Remove Part',
    reset: 'Reset',
    filters: {
      all: 'All',
      apps: 'Apps',
      libs: 'Libraries',
      e2e: 'E2E',
      edges: 'Edges',
      stars: 'Stars',
    },
    addedNotice: (name) => `Added "${name}" to the 3D architecture`,
    removedNotice: (name) => `Removed "${name}" from graph`,
    resetNotice: 'Graph reset to full workspace architecture',
    fullscreenAria: 'Toggle fullscreen 3D view',
  },
  fr: {
    summaryTitle: 'Graphe Nx réel de cette plateforme :',
    summaryBody: (p, d) =>
      `${p} projets et ${d} dépendances, exportés du dépôt au moment du build. Glissez pour pivoter à 360° ou cliquez pour ouvrir un projet.`,
    hint: 'Glissez pour faire pivoter en 3D · Pincez ou molette pour zoomer · Cliquez pour inspecter',
    spin: 'Rotation 360°',
    addPart: '+ Ajouter un module',
    removePart: '− Retirer un module',
    reset: 'Réinitialiser',
    filters: {
      all: 'Tous',
      apps: 'Applications',
      libs: 'Bibliothèques',
      e2e: 'E2E',
      edges: 'Liaisons',
      stars: 'Étoiles',
    },
    addedNotice: (name) => `Module "${name}" ajouté à l’architecture 3D`,
    removedNotice: (name) => `Module "${name}" retiré`,
    resetNotice: 'Graphe réinitialisé à l’architecture complète',
    fullscreenAria: 'Plein écran 3D',
  },
  ar: {
    summaryTitle: 'مخطط Nx الفعلي لهذه المنصة:',
    summaryBody: (p, d) =>
      `${p} مشروع و ${d} تبعية مستخرجة مباشرة من المستودع وقت البناء. اسحب للتدوير 360 درجة، أو انقر لفتح أي مشروع.`,
    hint: 'اسحب للتدوير ثلاثي الأبعاد · اقرص للتكبير · انقر للاستكشاف',
    spin: 'دوران 360°',
    addPart: '+ إضافة وحدة',
    removePart: '− إزالة وحدة',
    reset: 'إعادة ضبط',
    filters: {
      all: 'الكل',
      apps: 'التطبيقات',
      libs: 'المكتبات',
      e2e: 'اختبارات E2E',
      edges: 'الروابط',
      stars: 'النجوم',
    },
    addedNotice: (name) => `تمت إضافة "${name}" إلى البنية ثلاثية الأبعاد`,
    removedNotice: (name) => `تمت إزالة "${name}" من المخطط`,
    resetNotice: 'تمت استعادة بنية المستودع الكاملة',
    fullscreenAria: 'عرض ملء الشاشة ثلاثي الأبعاد',
  },
  it: {
    summaryTitle: 'Grafo Nx reale di questa piattaforma:',
    summaryBody: (p, d) =>
      `${p} progetti e ${d} dipendenze, esportati dal repository in fase di build. Trascina per ruotare a 360° o clicca su qualsiasi progetto per aprirlo.`,
    hint: 'Trascina per ruotare in 3D · Pizzica o scorri per zoomare · Clicca per ispezionare',
    spin: 'Rotazione 360°',
    addPart: '+ Aggiungi modulo',
    removePart: '− Rimuovi modulo',
    reset: 'Ripristina',
    filters: {
      all: 'Tutti',
      apps: 'App',
      libs: 'Librerie',
      e2e: 'E2E',
      edges: 'Connessioni',
      stars: 'Sfondo stellare',
    },
    addedNotice: (name) => `Modulo "${name}" aggiunto all’architettura 3D`,
    removedNotice: (name) => `Modulo "${name}" rimosso`,
    resetNotice: 'Grafo ripristinato all’architettura originale',
    fullscreenAria: 'Visualizzazione 3D a schermo intero',
  },
  de: {
    summaryTitle: 'Realer Nx-Projektgraph dieser Plattform:',
    summaryBody: (p, d) =>
      `${p} Projekte und ${d} Abhängigkeiten, zur Build-Zeit aus dem Repository exportiert. Ziehen für 360°-Drehung, oder klicken zum Öffnen eines Projekts.`,
    hint: 'Ziehen zum Drehen in 3D · Zoomen mit Scrollrad/Geste · Klicken zum Untersuchen',
    spin: '360°-Drehung',
    addPart: '+ Modul hinzufügen',
    removePart: '− Modul entfernen',
    reset: 'Zurücksetzen',
    filters: {
      all: 'Alle',
      apps: 'Apps',
      libs: 'Bibliotheken',
      e2e: 'E2E',
      edges: 'Verbindungen',
      stars: 'Sterne',
    },
    addedNotice: (name) => `Modul "${name}" zur 3D-Architektur hinzugefügt`,
    removedNotice: (name) => `Modul "${name}" entfernt`,
    resetNotice: 'Graph auf vollständige Workspace-Architektur zurückgesetzt',
    fullscreenAria: '3D-Vollbildansicht',
  },
};
