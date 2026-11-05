import type { SiteLanguage } from '@ah/shared/state';

export interface StrategyCopy {
  title: string;
  resetDemo: string;
  nav: {
    builder: string;
    ledger: string;
    analytics: string;
    compare: string;
    netWorth: string;
    whatIf: string;
    help: string;
  };
  reminder: {
    title: string;
    message: string;
    sub: string;
    logBtn: string;
    dismissBtn: string;
  };
}

export const STRATEGY_COPY: Record<SiteLanguage, StrategyCopy> = {
  en: {
    title: '✨ Financial Strategy Dashboard',
    resetDemo: '🔄 Reset Demo Data',
    nav: {
      builder: '✏️ Scenario Builder',
      ledger: '📓 Daily Ledger',
      analytics: '📈 Analytics',
      compare: '📊 Detailed Comparison',
      netWorth: '🏦 Net Worth',
      whatIf: '🔮 What-If',
      help: '❓ Help',
    },
    reminder: {
      title: 'Daily Reminder',
      message: 'You haven’t logged any transactions for today yet.',
      sub: 'Keep your ledger up to date!',
      logBtn: '➕ Log a Transaction',
      dismissBtn: 'Don’t show today',
    },
  },
  fr: {
    title: '✨ Tableau de bord stratégique & financier',
    resetDemo: '🔄 Réinitialiser les données démo',
    nav: {
      builder: '✏️ Constructeur de scénarios',
      ledger: '📓 Journal quotidien',
      analytics: '📈 Analytique',
      compare: '📊 Comparaison détaillée',
      netWorth: '🏦 Patrimoine net',
      whatIf: '🔮 Simulation What-If',
      help: '❓ Aide',
    },
    reminder: {
      title: 'Rappel quotidien',
      message: 'Aucune transaction enregistrée pour aujourd’hui.',
      sub: 'Gardez votre journal à jour !',
      logBtn: '➕ Saisir une transaction',
      dismissBtn: 'Ne plus afficher aujourd’hui',
    },
  },
  ar: {
    title: '✨ لوحة التحكم في الاستراتيجية المالية',
    resetDemo: '🔄 إعادة ضبط البيانات التجريبية',
    nav: {
      builder: '✏️ منشئ السيناريوهات',
      ledger: '📓 دفتر المعاملات اليومي',
      analytics: '📈 التحليلات المالية',
      compare: '📊 المقارنة التفصيلية',
      netWorth: '🏦 صافي الثروة',
      whatIf: '🔮 محاكاة "ماذا لو"',
      help: '❓ مساعدة',
    },
    reminder: {
      title: 'تذكير يومي',
      message: 'لم تقم بتسجيل أي معاملات مالية لليوم حتى الآن.',
      sub: 'حافظ على تحديث سجلك المالي باستمرار!',
      logBtn: '➕ تسجيل معاملة جديدة',
      dismissBtn: 'عدم الإظهار اليوم',
    },
  },
  it: {
    title: '✨ Dashboard Strategica Finanziaria',
    resetDemo: '🔄 Ripristina dati demo',
    nav: {
      builder: '✏️ Generatore di scenari',
      ledger: '📓 Giornale giornaliero',
      analytics: '📈 Analitica',
      compare: '📊 Confronto dettagliato',
      netWorth: '🏦 Patrimonio netto',
      whatIf: '🔮 Simulazione What-If',
      help: '❓ Guida',
    },
    reminder: {
      title: 'Promemoria giornaliero',
      message: 'Non hai ancora registrato transazioni per oggi.',
      sub: 'Tieni aggiornato il tuo registro!',
      logBtn: '➕ Registra una transazione',
      dismissBtn: 'Non mostrare oggi',
    },
  },
  de: {
    title: '✨ Dashboard für Finanzstrategie & Planung',
    resetDemo: '🔄 Demo-Daten zurücksetzen',
    nav: {
      builder: '✏️ Szenarien-Builder',
      ledger: '📓 Tägliches Journal',
      analytics: '📈 Analysen',
      compare: '📊 Detaillierter Vergleich',
      netWorth: '🏦 Nettovermögen',
      whatIf: '🔮 Was-wäre-wenn',
      help: '❓ Hilfe',
    },
    reminder: {
      title: 'Tägliche Erinnerung',
      message: 'Sie haben heute noch keine Buchungen erfasst.',
      sub: 'Halten Sie Ihr Journal aktuell!',
      logBtn: '➕ Buchung erfassen',
      dismissBtn: 'Heute nicht mehr anzeigen',
    },
  },
};
