import type { SiteLanguage } from '@ah/shared/state';

export interface DispatchCopy {
  navAria: string;
  tabs: {
    kanban: string;
    whatsapp: string;
    drivers: string;
    plants: string;
    stock: string;
    analytics: string;
  };
  badges: {
    onRoad: string;
    sheetsSync: string;
  };
  controls: {
    roleTitle: string;
    role: string;
    loadDemo: string;
    loadDemoTitle: string;
    clearData: string;
    clearDataTitle: string;
    enterFullscreen: string;
    exitFullscreen: string;
  };
}

export const DISPATCH_COPY: Record<SiteLanguage, DispatchCopy> = {
  en: {
    navAria: 'PulseOps Operations Modules',
    tabs: {
      kanban: 'Order Pipeline (Kanban)',
      whatsapp: 'WhatsApp Comms Hub',
      drivers: 'Driver Fleet & Routes',
      plants: 'Subcontractor Plants',
      stock: 'Linen Stock Sheet',
      analytics: 'Analytics & SLAs',
    },
    badges: {
      onRoad: 'on road',
      sheetsSync: 'Sheets Sync',
    },
    controls: {
      roleTitle:
        'Switch User Persona (Owner, Coordinator, Driver, Subcontractor, Customer) or Sign In',
      role: 'Role',
      loadDemo: 'Load Demo',
      loadDemoTitle: 'Load sample demonstration data',
      clearData: 'Clear Data',
      clearDataTitle: 'Clear all data to work from clean slate',
      enterFullscreen: '⤢ Fullscreen',
      exitFullscreen: '⤢ Exit Fullscreen',
    },
  },
  fr: {
    navAria: 'Modules opérationnels PulseOps',
    tabs: {
      kanban: 'Flux de commandes (Kanban)',
      whatsapp: 'Centre comms WhatsApp',
      drivers: 'Flotte chauffeurs & tournées',
      plants: 'Usines sous-traitantes',
      stock: 'Gestion des stocks linge',
      analytics: 'Analytique & SLA',
    },
    badges: {
      onRoad: 'en tournée',
      sheetsSync: 'Synchro Sheets',
    },
    controls: {
      roleTitle:
        'Changer de profil (Directeur, Coordinateur, Chauffeur, Sous-traitant, Client)',
      role: 'Rôle',
      loadDemo: 'Charger démo',
      loadDemoTitle: 'Charger des données d’exemple de démonstration',
      clearData: 'Effacer données',
      clearDataTitle: 'Réinitialiser toutes les données de l’application',
      enterFullscreen: '⤢ Plein écran',
      exitFullscreen: '⤢ Quitter plein écran',
    },
  },
  ar: {
    navAria: 'وحدات تشغيل وعمليات PulseOps',
    tabs: {
      kanban: 'مسار الطلبات (كانبان)',
      whatsapp: 'مركز محادثات واتساب',
      drivers: 'أسطول السائقين والمسارات',
      plants: 'مصانع المقاولين الفرعيين',
      stock: 'سجل مخزون الأقمشة',
      analytics: 'التحليلات ومستوى الخدمة SLA',
    },
    badges: {
      onRoad: 'على الطريق',
      sheetsSync: 'مزامنة الجداول',
    },
    controls: {
      roleTitle:
        'تبديل شخصية المستخدم (مالك، منسق عمليات، سائق، مصنع شريك، عميل)',
      role: 'الدور',
      loadDemo: 'تحميل نموذج تجريبي',
      loadDemoTitle: 'تحميل بيانات تجريبية للعرض',
      clearData: 'مسح البيانات',
      clearDataTitle: 'مسح كافة البيانات للبدء من جديد',
      enterFullscreen: '⤢ شاشة كاملة',
      exitFullscreen: '⤢ خروج من الشاشة الكاملة',
    },
  },
  it: {
    navAria: 'Moduli operativi PulseOps',
    tabs: {
      kanban: 'Pipeline ordini (Kanban)',
      whatsapp: 'Hub comunicazioni WhatsApp',
      drivers: 'Flotta autisti e itinerari',
      plants: 'Stabilimenti subappaltatori',
      stock: 'Giacenze e scorte biancheria',
      analytics: 'Analitica e SLA',
    },
    badges: {
      onRoad: 'su strada',
      sheetsSync: 'Sincronizzazione Sheets',
    },
    controls: {
      roleTitle:
        'Cambia profilo utente (Titolare, Coordinatore, Autista, Subappaltatore, Cliente)',
      role: 'Ruolo',
      loadDemo: 'Carica demo',
      loadDemoTitle: 'Carica dati dimostrativi di esempio',
      clearData: 'Cancella dati',
      clearDataTitle: 'Ripristina tutti i dati allo stato iniziale',
      enterFullscreen: '⤢ Schermo intero',
      exitFullscreen: '⤢ Esci da schermo intero',
    },
  },
  de: {
    navAria: 'PulseOps Betriebsmodule',
    tabs: {
      kanban: 'Auftragspipeline (Kanban)',
      whatsapp: 'WhatsApp-Kommunikations-Hub',
      drivers: 'Fahrerflotte & Touren',
      plants: 'Subunternehmer-Werke',
      stock: 'Wäsche-Bestandsübersicht',
      analytics: 'Analysen & SLAs',
    },
    badges: {
      onRoad: 'unterwegs',
      sheetsSync: 'Sheets-Synchronisierung',
    },
    controls: {
      roleTitle:
        'Benutzerprofil wechseln (Inhaber, Koordinator, Fahrer, Subunternehmer, Kunde)',
      role: 'Rolle',
      loadDemo: 'Demo laden',
      loadDemoTitle: 'Beispieldaten für Demonstration laden',
      clearData: 'Daten löschen',
      clearDataTitle: 'Alle Daten für einen Neuanfang zurücksetzen',
      enterFullscreen: '⤢ Vollbild',
      exitFullscreen: '⤢ Vollbild beenden',
    },
  },
};
