import type { AssistantLocale } from '@ah/shared/assistant';

/** The panel's own words, the same in every app. */
export interface AssistantCopy {
  readonly title: string;
  readonly newChat: string;
  readonly close: string;
  readonly message: string;
  readonly send: string;
  readonly stop: string;
  readonly typing: string;
  readonly undo: string;
  readonly apply: string;
  readonly cancel: string;
  readonly applied: string;
  readonly cancelled: string;
  readonly failed: string;
  readonly offline: string;
  readonly unavailable: string;
  readonly busy: (seconds: number) => string;
  readonly resting: string;
  readonly broken: string;
  readonly tooManySteps: string;
  readonly stopped: string;
  /** An action the chat stopped waiting for: it may still go through. */
  readonly tooSlow: string;
}

export const ASSISTANT_COPY: Readonly<Record<AssistantLocale, AssistantCopy>> =
  {
    en: {
      title: 'Assistant',
      newChat: 'New chat',
      close: 'Close the assistant',
      message: 'Message the assistant',
      send: 'Send',
      stop: 'Stop',
      typing: 'Writing…',
      undo: 'Undo',
      apply: 'Apply',
      cancel: 'Cancel',
      applied: 'Done',
      cancelled: 'Cancelled',
      failed: 'Didn’t work',
      offline:
        'You’re offline: the assistant needs a connection. Everything else works.',
      unavailable:
        'The assistant isn’t available right now. Everything else works.',
      busy: (s) => `The assistant is busy. Try again in ${s} seconds.`,
      resting:
        'The assistant has used today’s free allowance. It’s back tomorrow.',
      broken: 'Something went wrong with this chat. Start a new one.',
      tooManySteps:
        'That took too many steps, so I stopped. Try asking in smaller parts.',
      stopped: 'Stopped.',
      tooSlow:
        'It didn’t finish in time. It may still go through: check before trying again.',
    },
    fr: {
      title: 'Assistant',
      newChat: 'Nouvelle discussion',
      close: 'Fermer l’assistant',
      message: 'Écrire à l’assistant',
      send: 'Envoyer',
      stop: 'Arrêter',
      typing: 'Rédaction…',
      undo: 'Annuler',
      apply: 'Appliquer',
      cancel: 'Annuler',
      applied: 'Fait',
      cancelled: 'Annulé',
      failed: 'Échec',
      offline:
        'Vous êtes hors ligne : l’assistant a besoin d’une connexion. Tout le reste fonctionne.',
      unavailable:
        'L’assistant n’est pas disponible pour le moment. Tout le reste fonctionne.',
      busy: (s) => `L’assistant est occupé. Réessayez dans ${s} secondes.`,
      resting:
        'L’assistant a utilisé son quota gratuit du jour. Il revient demain.',
      broken:
        'Un problème est survenu dans cette discussion. Commencez-en une nouvelle.',
      tooManySteps:
        'Il a fallu trop d’étapes, je me suis arrêté. Posez la question en plusieurs fois.',
      stopped: 'Arrêté.',
      tooSlow:
        'Ça n’a pas abouti à temps. Ça peut encore se faire : vérifiez avant de réessayer.',
    },
    ar: {
      title: 'المساعد',
      newChat: 'محادثة جديدة',
      close: 'إغلاق المساعد',
      message: 'اكتب إلى المساعد',
      send: 'إرسال',
      stop: 'إيقاف',
      typing: 'يكتب…',
      undo: 'تراجع',
      apply: 'تطبيق',
      cancel: 'إلغاء',
      applied: 'تم',
      cancelled: 'أُلغي',
      failed: 'لم ينجح',
      offline: 'أنت غير متصل: المساعد يحتاج إلى اتصال. كل ما عداه يعمل.',
      unavailable: 'المساعد غير متاح الآن. كل ما عداه يعمل.',
      busy: (s) => `المساعد مشغول. أعد المحاولة بعد ${s} ثانية.`,
      resting: 'استهلك المساعد حصّته المجانية لهذا اليوم. يعود غدًا.',
      broken: 'حدث خطأ في هذه المحادثة. ابدأ محادثة جديدة.',
      tooManySteps: 'تطلّب ذلك خطوات كثيرة فتوقفت. اسأل على أجزاء أصغر.',
      stopped: 'توقّف.',
      tooSlow:
        'لم يكتمل في الوقت المحدد. قد يكتمل لاحقًا، فتحقّق قبل المحاولة مجددًا.',
    },
    it: {
      title: 'Assistente',
      newChat: 'Nuova chat',
      close: 'Chiudi l’assistente',
      message: 'Scrivi all’assistente',
      send: 'Invia',
      stop: 'Ferma',
      typing: 'Sta scrivendo…',
      undo: 'Annulla',
      apply: 'Applica',
      cancel: 'Annulla',
      applied: 'Fatto',
      cancelled: 'Annullato',
      failed: 'Non riuscito',
      offline:
        'Sei offline: l’assistente ha bisogno di una connessione. Tutto il resto funziona.',
      unavailable:
        'L’assistente non è disponibile ora. Tutto il resto funziona.',
      busy: (s) => `L’assistente è occupato. Riprova tra ${s} secondi.`,
      resting: 'L’assistente ha usato la quota gratuita di oggi. Torna domani.',
      broken: 'Qualcosa è andato storto in questa chat. Iniziane una nuova.',
      tooManySteps:
        'Servivano troppi passaggi, mi sono fermato. Chiedi un pezzo alla volta.',
      stopped: 'Fermato.',
      tooSlow:
        'Non è finito in tempo. Potrebbe ancora andare a buon fine: controlla prima di riprovare.',
    },
    de: {
      title: 'Assistent',
      newChat: 'Neuer Chat',
      close: 'Assistent schließen',
      message: 'Nachricht an den Assistenten',
      send: 'Senden',
      stop: 'Stopp',
      typing: 'Schreibt…',
      undo: 'Rückgängig',
      apply: 'Übernehmen',
      cancel: 'Abbrechen',
      applied: 'Erledigt',
      cancelled: 'Abgebrochen',
      failed: 'Fehlgeschlagen',
      offline:
        'Sie sind offline: Der Assistent braucht eine Verbindung. Alles andere funktioniert.',
      unavailable:
        'Der Assistent ist gerade nicht verfügbar. Alles andere funktioniert.',
      busy: (s) =>
        `Der Assistent ist ausgelastet. Versuchen Sie es in ${s} Sekunden wieder.`,
      resting:
        'Der Assistent hat sein kostenloses Tageskontingent verbraucht. Morgen geht es weiter.',
      broken:
        'In diesem Chat ist etwas schiefgelaufen. Starten Sie einen neuen.',
      tooManySteps:
        'Das hätte zu viele Schritte gebraucht, daher habe ich aufgehört. Fragen Sie in kleineren Teilen.',
      stopped: 'Gestoppt.',
      tooSlow:
        'Das wurde nicht rechtzeitig fertig. Es kann noch durchgehen: Prüf es, bevor du es noch einmal versuchst.',
    },
  };

export function assistantCopy(locale: string): AssistantCopy {
  return ASSISTANT_COPY[locale as AssistantLocale] ?? ASSISTANT_COPY.en;
}
