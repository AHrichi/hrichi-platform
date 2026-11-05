import type { SiteLanguage } from '@ah/shared/state';

export interface StudyLmCopy {
  tagline: string;
  selectSubject: string;
  newSubject: string;
  deleteSubject: string;
  n8nEngine: string;
  checking: string;
  online: string;
  offline: string;
  exportGuide: string;
  metrics: {
    roadmap: string;
    roadmapHint: string;
    progress: string;
    progressHint: string;
    cardsDue: string;
    cardsDueHint: string;
    quizAccuracy: string;
    quizAccuracyHint: string;
  };
  screens: {
    roadmap: string;
    learn: string;
    flashcards: string;
    quiz: string;
    sources: string;
    stats: string;
  };
}

export const STUDYLM_COPY: Record<SiteLanguage, StudyLmCopy> = {
  en: {
    tagline: 'Pedagogical Curriculum & Drill Engine',
    selectSubject: 'Select Subject...',
    newSubject: 'New Subject',
    deleteSubject: 'Delete',
    n8nEngine: 'n8n Engine',
    checking: 'Checking…',
    online: 'Online',
    offline: 'Offline',
    exportGuide: 'Export Guide',
    metrics: {
      roadmap: 'Roadmap Sections',
      roadmapHint: 'Chapters & Phases',
      progress: 'Synthesis Progress',
      progressHint: 'Active Curriculum Mastery',
      cardsDue: 'Review Cards Due',
      cardsDueHint: 'Spaced Repetition Queue',
      quizAccuracy: 'Arena Accuracy',
      quizAccuracyHint: 'Historical Retention',
    },
    screens: {
      roadmap: 'Roadmap',
      learn: 'Lessons',
      flashcards: 'Flashcards',
      quiz: 'Quiz',
      sources: 'Reference docs',
      stats: 'Progress',
    },
  },
  fr: {
    tagline: 'Moteur pédagogique de cours et d’entraînement',
    selectSubject: 'Choisir une matière...',
    newSubject: 'Nouvelle matière',
    deleteSubject: 'Supprimer',
    n8nEngine: 'Moteur n8n',
    checking: 'Vérification…',
    online: 'En ligne',
    offline: 'Hors-ligne',
    exportGuide: 'Exporter le guide',
    metrics: {
      roadmap: 'Sections du parcours',
      roadmapHint: 'Chapitres & modules',
      progress: 'Progression globale',
      progressHint: 'Maîtrise du programme',
      cardsDue: 'Cartes à réviser',
      cardsDueHint: 'File de répétition espacée',
      quizAccuracy: 'Précision des quiz',
      quizAccuracyHint: 'Rétention mesurée',
    },
    screens: {
      roadmap: 'Feuille de route',
      learn: 'Leçons',
      flashcards: 'Cartes mémoire',
      quiz: 'Quiz & arène',
      sources: 'Documentation',
      stats: 'Statistiques',
    },
  },
  ar: {
    tagline: 'محرك المسارات التعليمية والتدريب التفاعلي',
    selectSubject: 'اختر مادة دراسية...',
    newSubject: 'مادة جديدة',
    deleteSubject: 'حذف',
    n8nEngine: 'محرك n8n',
    checking: 'جارٍ التحقق…',
    online: 'متصل',
    offline: 'غير متصل',
    exportGuide: 'تصدير الدليل',
    metrics: {
      roadmap: 'أقسام المسار',
      roadmapHint: 'الفصول والمراحل',
      progress: 'معدل الإتقان',
      progressHint: 'استيعاب المنهاج النشط',
      cardsDue: 'بطاقات مستحقة للمراجعة',
      cardsDueHint: 'طابور التكرار المتباعد',
      quizAccuracy: 'دقة الإجابات',
      quizAccuracyHint: 'مستوى التذكر التاريخي',
    },
    screens: {
      roadmap: 'خارطة التعلم',
      learn: 'الدروس',
      flashcards: 'بطاقات التذكر',
      quiz: 'الاختبارات',
      sources: 'المراجع والوثائق',
      stats: 'التقدم والإحصائيات',
    },
  },
  it: {
    tagline: 'Motore pedagogico di studio e allenamento continuo',
    selectSubject: 'Seleziona materia...',
    newSubject: 'Nuova materia',
    deleteSubject: 'Elimina',
    n8nEngine: 'Motore n8n',
    checking: 'Verifica in corso…',
    online: 'Online',
    offline: 'Offline',
    exportGuide: 'Esporta guida',
    metrics: {
      roadmap: 'Sezioni della roadmap',
      roadmapHint: 'Capitoli e moduli',
      progress: 'Progresso di sintesi',
      progressHint: 'Padronanza del programma',
      cardsDue: 'Carte da ripassare',
      cardsDueHint: 'Coda di ripetizione spaziata',
      quizAccuracy: 'Precisione quiz',
      quizAccuracyHint: 'Tasso di memorizzazione',
    },
    screens: {
      roadmap: 'Roadmap',
      learn: 'Lezioni',
      flashcards: 'Flashcard',
      quiz: 'Quiz',
      sources: 'Fonti e riferimenti',
      stats: 'Statistiche',
    },
  },
  de: {
    tagline: 'Pädagogische Lehrplan- & Übungs-Engine',
    selectSubject: 'Fach auswählen...',
    newSubject: 'Neues Fach',
    deleteSubject: 'Löschen',
    n8nEngine: 'n8n-Engine',
    checking: 'Wird geprüft…',
    online: 'Online',
    offline: 'Offline',
    exportGuide: 'Leitfaden exportieren',
    metrics: {
      roadmap: 'Lehrplan-Abschnitte',
      roadmapHint: 'Kapitel & Module',
      progress: 'Lernfortschritt',
      progressHint: 'Beherrschung des Curriculums',
      cardsDue: 'Fällige Karteikarten',
      cardsDueHint: 'Spaced-Repetition-Warteschlange',
      quizAccuracy: 'Quiz-Genauigkeit',
      quizAccuracyHint: 'Gemessene Wissensretention',
    },
    screens: {
      roadmap: 'Lehrplan',
      learn: 'Lektionen',
      flashcards: 'Karteikarten',
      quiz: 'Quiz',
      sources: 'Referenzen & Quellen',
      stats: 'Fortschritt',
    },
  },
};
