import type { DashboardCopy } from './copy.en';

export const FR: DashboardCopy = {
  app: {
    name: 'Planificateur de main-d’œuvre',
    tagline: 'Effectifs de récolte en serre',
    language: 'Langue',
    demo: 'Ferme de démonstration : serres, équipes et quatre semaines d’historique fictifs. Les modifications ne sont pas enregistrées.',
  },
  plan: {
    title: 'Plan de la semaine',
    week: 'Semaine du {date}',
    previous: 'Semaine précédente',
    next: 'Semaine suivante',
    thisWeek: 'Cette semaine',
    hours: 'Heures par jour de récolte',
    greenhouse: 'Serre',
    total: 'Semaine',
    cell: '{greenhouse}, {day} : kg prévus',
    workers: '{n} ouvriers',
    tableHint:
      'Kg prévus par serre et par jour. Sous chaque valeur, les ouvriers nécessaires au rythme de l’équipe.',
    tableLabel: 'Plan de la semaine par serre et par jour',
    needed: 'Ouvriers nécessaires',
    available: 'Disponibles',
    short: 'Manquants',
    teamGap:
      'Certaines équipes manquent de bras pendant que d’autres en ont en trop : les déplacer comble une partie de l’écart.',
    issues:
      '{n} lignes du plan ont été écartées (serre inconnue ou chiffres invalides).',
  },
  kpi: {
    kg: 'Prévu cette semaine',
    workerDays: 'Journées-ouvrier nécessaires',
    shortage: 'Journées-ouvrier manquantes',
    worst: 'Jour le plus tendu',
    none: 'Aucun',
  },
  report: {
    title: 'Rapport de manque pour les RH',
    subject: 'Ouvriers nécessaires, semaine du {date}',
    heading: 'Ouvriers nécessaires, semaine du {date}',
    line: '{day} : il en manque {n} ({required} nécessaires, {available} disponibles)',
    total: 'Journées-ouvrier manquantes cette semaine : {n}',
    none: 'Aucun manque cette semaine.',
    copy: 'Copier',
    copied: 'Copié',
    whatsapp: 'Envoyer par WhatsApp',
    email: 'Envoyer par e-mail',
    print: 'Imprimer',
  },
  crops: {
    tomato: 'Tomate',
    'cherry-tomato': 'Tomate cerise',
    pepper: 'Poivron',
    cucumber: 'Concombre',
    melon: 'Melon',
    strawberry: 'Fraise',
    other: 'Autre culture',
  },
};
