import type { SiteLanguage } from '@ah/shared/state';

export interface ServicesCopy {
  services: {
    eyebrow: string;
    heading: string;
    startProject: string;
    projectEnquiry: string;
    whatYouGet: string;
    proof: string;
    howIWork: string;
    step: string;
  };
  contact: {
    eyebrow: string;
    heading: string;
    lead: string;
    otherWays: string;
    email: string;
    linkedin: string;
    github: string;
    location: string;
    timezone: string;
    hiringText: string;
    cvText: string;
    hiringDetails: string;
    servicesText: string;
  };
  form: {
    sentTitle: string;
    sentText: string;
    sendAnother: string;
    formTitle: string;
    intentLabel: string;
    intents: {
      role: string;
      freelance: string;
      general: string;
    };
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    honeypot: string;
    unavailableHint: string;
    continueInEmail: string;
    send: string;
    sending: string;
    preparing: string;
    waking: string;
    rejected: string;
    failed: string;
    sendByEmail: string;
  };
}

export const SERVICES_COPY: Record<SiteLanguage, ServicesCopy> = {
  en: {
    services: {
      eyebrow: 'Freelance',
      heading: 'Services',
      startProject: 'Start a project',
      projectEnquiry: 'Project enquiry',
      whatYouGet: 'What you get',
      proof: 'Proof:',
      howIWork: 'How I work',
      step: 'Step',
    },
    contact: {
      eyebrow: 'Contact',
      heading: 'Let’s talk',
      lead: 'About a full-time role or a freelance project. The form reaches me directly; email works too.',
      otherWays: 'Other ways to reach me',
      email: 'Email',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      location: 'Location',
      timezone: 'Time zone',
      hiringText: 'Hiring?',
      cvText: 'My CV',
      hiringDetails: 'has the details recruiters ask for first. A project? See',
      servicesText: 'services',
    },
    form: {
      sentTitle: 'Thanks, your message is on its way',
      sentText:
        'It reached me directly. I’ll answer at the email address you gave.',
      sendAnother: 'Send another message',
      formTitle: 'Send a message',
      intentLabel: 'What is it about?',
      intents: {
        role: 'A full-time role',
        freelance: 'A freelance project',
        general: 'Something else',
      },
      nameLabel: 'Your name',
      emailLabel: 'Your email',
      messageLabel: 'Message',
      honeypot: 'Leave this field empty',
      unavailableHint:
        "Sending from the site isn't available right now. Your email app will open with this message.",
      continueInEmail: 'Continue in your email app',
      send: 'Send message',
      sending: 'Sending…',
      preparing: 'Preparing the form…',
      waking: 'Waking up the free-tier server. This can take up to a minute.',
      rejected: 'The spam check failed. Please complete it again.',
      failed: "The server couldn't be reached.",
      sendByEmail: 'Send the same message by email',
    },
  },
  fr: {
    services: {
      eyebrow: 'Freelance',
      heading: 'Services',
      startProject: 'Démarrer un projet',
      projectEnquiry: 'Demande de projet',
      whatYouGet: 'Ce que vous obtenez',
      proof: 'Preuves :',
      howIWork: 'Méthodologie de travail',
      step: 'Étape',
    },
    contact: {
      eyebrow: 'Contact',
      heading: 'Échangeons ensemble',
      lead: 'Pour un poste à temps plein ou un projet freelance. Ce formulaire me parvient directement ; l’e-mail fonctionne aussi.',
      otherWays: 'Autres moyens de me joindre',
      email: 'E-mail',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      location: 'Localisation',
      timezone: 'Fuseau horaire',
      hiringText: 'Vous recrutez ?',
      cvText: 'Mon CV',
      hiringDetails:
        'contient les informations clés. Un projet ? Consultez les',
      servicesText: 'services',
    },
    form: {
      sentTitle: 'Merci, votre message est bien parti',
      sentText:
        'Il m’est parvenu directement. Je vous répondrai à l’adresse e-mail renseignée.',
      sendAnother: 'Envoyer un autre message',
      formTitle: 'Envoyer un message',
      intentLabel: 'Quel est l’objet de votre message ?',
      intents: {
        role: 'Une opportunité CDI / plein temps',
        freelance: 'Un projet freelance',
        general: 'Autre sujet',
      },
      nameLabel: 'Votre nom',
      emailLabel: 'Votre e-mail',
      messageLabel: 'Message',
      honeypot: 'Laissez ce champ vide',
      unavailableHint:
        'L’envoi direct est indisponible pour le moment. Votre logiciel de messagerie va s’ouvrir avec ce contenu.',
      continueInEmail: 'Continuer dans votre client e-mail',
      send: 'Envoyer le message',
      sending: 'Envoi en cours…',
      preparing: 'Initialisation du formulaire…',
      waking: 'Réveil du serveur d’API. Cela peut prendre une minute.',
      rejected: 'La vérification anti-spam a échoué. Veuillez réessayer.',
      failed: 'Le serveur est temporairement inaccessible.',
      sendByEmail: 'Envoyer le même message par e-mail',
    },
  },
  ar: {
    services: {
      eyebrow: 'العمل الحر والاستشارات',
      heading: 'الخدمات الهندسية',
      startProject: 'بدء مشروع جديد',
      projectEnquiry: 'طلب استشارة مشروع',
      whatYouGet: 'المخرجات والتسليمات',
      proof: 'أمثلة عملية:',
      howIWork: 'منهجية العمل',
      step: 'الخطوة',
    },
    contact: {
      eyebrow: 'تواصل معي',
      heading: 'فلنتحدث معاً',
      lead: 'بشأن وظيفة بدوام كامل أو مشروع عمل حر واستشاري. يصلني هذا النموذج مباشرة، والبريد الإلكتروني متاح دوماً.',
      otherWays: 'طرق أخرى للتواصل',
      email: 'البريد الإلكتروني',
      linkedin: 'لينكد إن (LinkedIn)',
      github: 'غيت هاب (GitHub)',
      location: 'الموقع الجغرافي',
      timezone: 'المنطقة الزمنية',
      hiringText: 'هل تبحث عن توظيف؟',
      cvText: 'سيرتي الذاتية',
      hiringDetails: 'تتضمن كل التفاصيل الأساسية. مشروع مستقل؟ استعرض',
      servicesText: 'الخدمات',
    },
    form: {
      sentTitle: 'شكراً لك، تم إرسال رسالتك بنجاح',
      sentText:
        'وصلتني رسالتك مباشرة. سأجيبك على عنوان البريد الذي أدخلته قريباً.',
      sendAnother: 'إرسال رسالة أخرى',
      formTitle: 'إرسال رسالة مباشرة',
      intentLabel: 'ما هو موضوع التواصل؟',
      intents: {
        role: 'فرصة عمل بدوام كامل',
        freelance: 'مشروع عمل حر / استشارة',
        general: 'موضوع آخر',
      },
      nameLabel: 'الاسم الكريم',
      emailLabel: 'بريدك الإلكتروني',
      messageLabel: 'نص الرسالة',
      honeypot: 'اترك هذا الحقل فارغاً',
      unavailableHint:
        'الإرسال المباشر عبر الموقع غير متاح حالياً. سيتم فتح تطبيق البريد الخاص بك متضمناً نص الرسالة.',
      continueInEmail: 'المتابعة عبر تطبيق البريد',
      send: 'إرسال الرسالة',
      sending: 'جارٍ الإرسال…',
      preparing: 'جارٍ تجهيز النموذج…',
      waking: 'جارٍ تشغيل الخادم. قد يستغرق ذلك دقيقة واحدة.',
      rejected: 'فشل التحقق من الأمان ومكافحة السبام. يُرجى المحاولة ثانية.',
      failed: 'تعذر الاتصال بالخادم في الوقت الحالي.',
      sendByEmail: 'إرسال نفس الرسالة عبر البريد الإلكتروني',
    },
  },
  it: {
    services: {
      eyebrow: 'Freelance & Consulenza',
      heading: 'Servizi',
      startProject: 'Inizia un progetto',
      projectEnquiry: 'Richiesta di progetto',
      whatYouGet: 'Cosa include',
      proof: 'Casi reali:',
      howIWork: 'Metodologia di lavoro',
      step: 'Fase',
    },
    contact: {
      eyebrow: 'Contatti',
      heading: 'Parliamone insieme',
      lead: 'Per un ruolo a tempo pieno o un progetto freelance. Il modulo mi arriva direttamente; anche l’email è sempre valida.',
      otherWays: 'Altri modi per contattarmi',
      email: 'Email',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      location: 'Sede',
      timezone: 'Fuso orario',
      hiringText: 'Stai assumendo?',
      cvText: 'Il mio CV',
      hiringDetails:
        'contiene tutti i dettagli prioritari. Un progetto? Esplora i',
      servicesText: 'servizi',
    },
    form: {
      sentTitle: 'Grazie, il tuo messaggio è in viaggio',
      sentText:
        'È arrivato direttamente a me. Ti risponderò all’indirizzo email fornito.',
      sendAnother: 'Invia un altro messaggio',
      formTitle: 'Invia un messaggio',
      intentLabel: 'Di cosa si tratta?',
      intents: {
        role: 'Un’opportunità a tempo pieno',
        freelance: 'Un progetto freelance',
        general: 'Altro argomento',
      },
      nameLabel: 'Il tuo nome',
      emailLabel: 'La tua email',
      messageLabel: 'Messaggio',
      honeypot: 'Lascia vuoto questo campo',
      unavailableHint:
        'L’invio dal sito non è al momento disponibile. Si aprirà il tuo client email con questo messaggio compilato.',
      continueInEmail: 'Continua nel tuo client email',
      send: 'Invia messaggio',
      sending: 'Invio in corso…',
      preparing: 'Preparazione del modulo…',
      waking: 'Avvio del server cloud. Potrebbe richiedere fino a un minuto.',
      rejected: 'Controllo antispam fallito. Riprova.',
      failed: 'Impossibile raggiungere il server.',
      sendByEmail: 'Invia lo stesso messaggio via email',
    },
  },
  de: {
    services: {
      eyebrow: 'Freelance & Beratung',
      heading: 'Leistungen',
      startProject: 'Projekt anfragen',
      projectEnquiry: 'Projektanfrage',
      whatYouGet: 'Was Sie erhalten',
      proof: 'Referenzen:',
      howIWork: 'Vorgehensweise',
      step: 'Schritt',
    },
    contact: {
      eyebrow: 'Kontakt',
      heading: 'Lassen Sie uns sprechen',
      lead: 'Über eine Festanstellung oder ein Freelance-Projekt. Das Formular erreicht mich direkt; E-Mail funktioniert ebenfalls.',
      otherWays: 'Weitere Kontaktwege',
      email: 'E-Mail',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      location: 'Standort',
      timezone: 'Zeitzone',
      hiringText: 'Auf der Suche nach Verstärkung?',
      cvText: 'Mein Lebenslauf',
      hiringDetails: 'enthält die wichtigsten Eckdaten. Ein Projekt? Siehe',
      servicesText: 'Leistungen',
    },
    form: {
      sentTitle: 'Vielen Dank, Ihre Nachricht ist unterwegs',
      sentText:
        'Sie hat mich direkt erreicht. Ich melde mich unter der angegebenen E-Mail-Adresse.',
      sendAnother: 'Weitere Nachricht senden',
      formTitle: 'Nachricht senden',
      intentLabel: 'Worum geht es?',
      intents: {
        role: 'Eine Festanstellung / Vollzeitrolle',
        freelance: 'Ein Freelance-Projekt',
        general: 'Anderes Anliegen',
      },
      nameLabel: 'Ihr Name',
      emailLabel: 'Ihre E-Mail-Adresse',
      messageLabel: 'Nachricht',
      honeypot: 'Dieses Feld bitte leer lassen',
      unavailableHint:
        'Direkter Versand über die Website ist derzeit nicht verfügbar. Ihr E-Mail-Programm öffnet sich mit dieser Nachricht.',
      continueInEmail: 'Im E-Mail-Programm fortfahren',
      send: 'Nachricht absenden',
      sending: 'Wird gesendet…',
      preparing: 'Formular wird vorbereitet…',
      waking:
        'API-Server wird gestartet. Dies kann bis zu einer Minute dauern.',
      rejected: 'Spamschutz-Prüfung fehlgeschlagen. Bitte erneut versuchen.',
      failed: 'Der Server konnte nicht erreicht werden.',
      sendByEmail: 'Gleiche Nachricht per E-Mail senden',
    },
  },
};
