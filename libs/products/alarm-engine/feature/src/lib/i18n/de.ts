import type { AlarmEngineDictionary } from './i18n.types';

export const deDictionary: AlarmEngineDictionary = {
  meta: {
    title: 'Entscheidungs-Engine für Weckzeiten',
    tagline:
      'Dein 60-Sekunden-Schlafenszeit-Algorithmus: Täglichen Lernfortschritt erfassen, T-3/T-7/T-14 Spaced-Repetition automatisch berechnen, Konsolidierungs-Meilensteine erkennen und Weckzeitentitel mit einem Klick aufs Smartphone übernehmen.',
    badgeAlgorithm: 'Abend-Algorithmus',
    badgeDarkMode: 'Dunkel- & Hell-Modus',
    badgeSpacedRepetition: 'Spaced Repetition T-3 / T-7 / T-14',
  },
  actions: {
    jsonBackup: 'JSON-Backup',
    resetChecklist: 'Checkliste zurücksetzen',
    clearData: 'Alle Daten löschen',
    loadDemoData: 'Beispieldaten laden',
    saveAndCommit: 'Abendritual speichern & festschreiben',
    copyAll: 'Alle kopieren',
    copySlot: 'Kopieren',
    downloadIcs: '.ics exportieren',
    quickRecall: 'Schnellabfrage',
    addChapter: 'Neues Kapitel',
    editChapter: 'Bearbeiten',
    deleteChapter: 'Löschen',
    toggleTheme: 'Design wechseln',
    language: 'Sprache',
    viewAllTopics: 'Alle Themen',
    newTopic: '+ Thema / Lehrplan',
    editTopic: 'Thema bearbeiten',
  },
  stepsGuide: {
    step1Title: 'Tagesabschluss',
    step1Desc:
      'Heutiges Kapitel, Quiz-Punktzahl und verbliebenen Programmierübertrag eintragen.',
    step2Title: 'Wiederholungen',
    step2Desc:
      'Fällige Karteikarten abhaken. Nicht erledigte Wiederholungen rollieren stressfrei automatisch weiter.',
    step3Title: 'Wecker stellen',
    step3Desc:
      'Generierte Titel für morgen mit einem Klick direkt in die Smartphone-Uhr-App übernehmen.',
  },
  kpi: {
    tomorrowProtocol: 'Morgen-Protokoll',
    targetChapter: 'Zielkapitel',
    nextStep: 'Nächster Meilenstein',
    activeWeakChapters: 'Aktive Schwachstellen',
    flaggedReinforce: 'zur Vertiefung markiert',
    milestoneConsolidation: 'Konsolidierungs-Zyklus',
    chaptersLeft: 'Kapitel verbleibend',
    cycle6Ch: '6-Kapitel-Zyklus',
    topicFilter: 'Themenbereich',
  },
  nav: {
    decision: 'Abendentscheidung',
    tracker: 'Lern-Tracker',
    guide: 'Leitfaden & 1-Wochen-Beispiel',
    reference: '8-Wecker-Smartphone-Guide',
    decisionShort: 'Entscheidung',
    trackerShort: 'Tracker',
    guideShort: 'Leitfaden',
    referenceShort: 'Wecker',
  },
  collapse: {
    collapse: 'Bereich einklappen',
    expand: 'Bereich ausklappen',
    collapsedSummary: 'Klicken zum Aufklappen dieses Bereichs',
  },
  notifications: {
    title: 'Push-Benachrichtigungen für Weckzeiten',
    subtitle:
      'Erhalte Weckerinnerungen im Browser passgenau zu deinen Weckzeiten (06:00, 08:15, 10:00 usw.)',
    enableBtn: 'Benachrichtigungen aktivieren',
    disableBtn: 'Benachrichtigungen deaktivieren',
    testBtn: '🔔 Test-Benachrichtigung',
    statusGranted: 'Aktiv & terminiert',
    statusDenied: 'Im Browser blockiert',
    statusDefault: 'Berechtigung erforderlich',
    statusUnsupported: 'Browser nicht unterstützt',
    nextAlarmAlert: 'Nächster Weckeralarm',
    testNotificationTitle: '⏰ Alarm Engine Test-Benachrichtigung',
    testNotificationBody:
      'Push-Benachrichtigungen funktionieren einwandfrei! Du wirst morgen zu den Weckzeiten benachrichtigt.',
    permissionDeniedNotice:
      'Benachrichtigungen sind in deinen Browsereinstellungen blockiert. Bitte für diese Website freigeben.',
    enabledNotice:
      'Push-Benachrichtigungen aktiviert! Erinnerungen ertönen zu den geplanten Weckzeiten.',
    disabledNotice: 'Push-Benachrichtigungen deaktiviert.',
  },
  checklist: {
    title: 'Abendritual-Checkliste',
    resetTooltip: '9-Punkte-Checkliste auf 0/9 zurücksetzen',
    step1: '1. Heutiges Kapitel und ursprüngliches Lerndatum erfassen',
    step2: '2. Quiz-Punktzahl und schwache Themen protokollieren',
    step3: '3. Fällige Kapitel für T-3 Flashcards prüfen',
    step4: '4. Fällige Kapitel für T-7 Diagnostik-Quizze prüfen',
    step5: '5. Fällige Kapitel für T-14 Feynman-Recall prüfen',
    step6: '6. Tagestyp für morgen bestimmen',
    step7: '7. Prüfen, ob morgen ein Konsolidierungstag ansteht',
    step8: '8. Weckertitel generieren und aktualisieren',
    step9: '9. Alle Weckzeiten in der Smartphone-Uhr-App kontrollieren',
  },
  questionnaire: {
    title: 'Abend-Diagnostik',
    subtitle: 'Beantworte 3 kurze Fragen zu deiner heutigen Lerneinheit',
    tonightDate: 'Datum heute Abend',
    defaultsToday: 'Standardmäßig heutiges Datum',
    topic: 'Fach / Themenbereich',
    targetChapterNum: 'Ziel-Kapitelnummer',
    targetChapterTitle: 'Kapiteltitel / Unterthema',
    targetChapterTitlePlaceholder:
      'z. B. B-Trees & LSM-Trees, TCP-Architektur...',
    highestCompletedPlusOne: 'Zuletzt abgeschlossen + 1',
    didYouFinish: 'Hast du das heutige Kapitel erfolgreich abgeschlossen?',
    optFinished: 'Kapitel abgeschlossen',
    optRepeat: 'Kapitel wiederholen',
    optConsolidation: 'Konsolidierung abgeschlossen',
    optMissed: 'Ziele verfehlt / Ausfall',
    advancesNotice:
      'Rückt für morgen zum nächsten Kapitel vor und plant die T-3, T-7 und T-14 Wiederholungen ein.',
    repeatNotice:
      'Belässt dieses Kapitel für morgen, um das Wissen zu festigen, bevor neues Material hinzukommt.',
    consolidationNotice:
      'Schließt den 6-Kapitel-Konsolidierungszyklus ab, setzt Warnungen zurück und startet neue Kapitel.',
    missedNotice:
      'Adaptives Protokoll aktiv: Pausiert neue Kapitel, entlastet den morgigen Tag und verhindert Überforderung.',
    missedReasonLabel: 'Was ist heute dazwischengekommen?',
    missedReasonOffTrack:
      'Ablenkung / Zeitverlust (Gezielter Zeitblock-Aufholplan)',
    missedReasonOverwhelmed:
      'Mentale Erschöpfung / Überlastung (Sanfte Entlastung)',
    missedReasonEmergency: 'Notfall / Krankheit (Regenerationstag)',
    quizPerformance: 'Quiz-Ergebnis',
    strongPass: 'Souverän bestanden (>= 75 %)',
    weakWarning: 'Schwachstellen (< 75 % oder >= 3 Fehler)',
    questionsMissed: 'Falsch beantwortete Fragen',
    quizScore: 'Quiz-Punktzahl (%)',
    codingProgress: 'Heutiger Programmierfortschritt',
    codingClean: 'Sauber abgeschlossen',
    codingCarryover: 'Unvollständig – Übertrag auf morgen',
    spacedReviewsDue: 'Heute Abend fällige Wiederholungen',
    rolloverRuleTitle: 'Rollover-Regel (Kein Frust, kein Verfall)',
    rolloverRuleDesc:
      'Wenn du eine Wiederholung heute Abend nicht abhakst, ändert sich ihr Lerndatum NIE; sie wandert automatisch in den 06:00-Wecker von morgen.',
    noReviewsDue: '🎉 Heute Abend stehen keine Wiederholungen an!',
    errorNotesLabel: 'Fehlernotizen / Schwachstellen',
    errorNotesPlaceholder:
      'z. B. async/await-Fehlerbehandlung, Zeigerarithmetik...',
    errorNotesHint:
      'Fließt direkt in die morgigen Test- und Refactoring-Aufgaben ein.',
    tomorrowDayType: 'Tagestyp für morgen auswählen',
  },
  schedule: {
    title: 'Weckzeiten-Fahrplan für morgen',
    subtitle: 'Exakt generierte Titel für deine wiederkehrenden Weckzeiten',
    oneMinuteSetupNotice:
      'Richte deine Weckzeiten einmalig in der Uhr-App deines Smartphones ein. Jeden Abend kopierst du die Titel in unter 60 Sekunden!',
    copiedToast: 'In die Zwischenablage kopiert: ',
    allCopiedToast: 'Alle Weckertitel wurden kopiert!',
  },
  tracker: {
    title: 'Lern-Tracker (Historie & Fakten)',
    subtitle:
      'Unveränderliche Lerndaten, Spaced-Repetition-Fälligkeiten und Beherrschungsgrade',
    emptyTitle: 'Noch keine Kapitel erfasst',
    emptyDesc:
      'Starte aufgeräumt durch! Absolviere das heutige Abendritual oder klicke auf „Neues Kapitel“, um deine erste Lerneinheit anzulegen.',
    startFirstChapter: '1. Kapitel anlegen',
    filterAll: 'Alle Kapitel',
    filterWeak: 'Nur Schwachstellen',
    filterDue: 'Fällige Wiederholungen',
    filterCarryover: 'Code-Übertrag',
    thChapter: 'Kapitel',
    thTopic: 'Thema',
    thStudied: 'Gelernt am',
    thD3: 'T-3 (Karteikarten)',
    thD7: 'T-7 (Quiz)',
    thD14: 'T-14 (Freier Recall)',
    thQuiz: 'Quiz-Note',
    thStatus: 'Status',
    thNotes: 'Fehlernotizen',
    thActions: 'Aktionen',
    badgeDue: 'FÄLLIG',
    badgeDone: 'ERLEDIGT ✓',
    badgePending: 'AUSSTEHEND',
    badgeWeak: 'SCHWACH',
    badgeCarryover: 'ÜBERTRAG',
  },
  modal: {
    addChapterTitle: 'Kapitel hinzufügen',
    editChapterTitle: 'Kapitel bearbeiten',
    chapterNumber: 'Kapitelnummer',
    chapterTitle: 'Kapiteltitel',
    topic: 'Thema / Fach',
    studyDate: 'Ursprüngliches Lerndatum',
    autoFillNotice:
      '⚡ T-3 (+3 Tage), T-7 (+7 Tage) und T-14 (+14 Tage) werden sofort automatisch anhand des Lerndatums errechnet.',
    d3Label: 'T-3 Datum (Karteikarten)',
    d7Label: 'T-7 Datum (Quiz)',
    d14Label: 'T-14 Datum (Freier Recall)',
    quizScore: 'Quiz-Punktzahl (%)',
    questionsMissed: 'Fehlerhafte Fragen',
    codingCarryover: 'Code-Übertrag',
    errorNotes: 'Fehlernotizen / Wissenslücken',
    cancel: 'Abbrechen',
    save: 'Speichern',
    backupTitle: 'JSON Backup & Wiederherstellung',
    backupDesc:
      'Kopiere deine JSON-Sicherung oder füge ein bestehendes Backup ein, um deinen gesamten Lernstand wiederherzustellen.',
    copyJson: 'JSON kopieren',
    importJson: 'JSON importieren',
    uploadFile: 'Datei hochladen (.json)',
  },
  tooltips: {
    d3Title: 'T-3 Abfrage (Flashcards)',
    d3Body:
      'Erste Spaced-Repetition-Stufe (+3 Tage). Gezieltes Durchgehen der Karteikarten stoppt den steilen Abfall der Vergessenskurve.',
    d3Formula: 'Lerndatum + 3 Tage',
    d3Meaning: 'Stabilisiert neue Synapsen vor dem massiven Vergessen.',
    d7Title: 'T-7 Diagnostik-Quiz',
    d7Body:
      'Zweite Stufe (+7 Tage). Aktiver Test zur Wissensüberprüfung und Aufdeckung verdeckter Verständnislücken.',
    d7Formula: 'Lerndatum + 7 Tage',
    d7Meaning: 'Aktives Abrufen stärkt die Gedächtnisspur nachhaltig.',
    d14Title: 'T-14 Feynman-Recall (Freie Wiedergabe)',
    d14Body:
      'Dritte Stufe (+14 Tage). Freies mündliches Erklären ohne Notizen zur langfristigen Verankerung im Langzeitgedächtnis.',
    d14Formula: 'Lerndatum + 14 Tage',
    d14Meaning: 'Belegt echtes konzeptionelles Verständnis durch Lehren.',
    consolidationTitle: 'Konsolidierungstag',
    consolidationBody:
      'Wird alle 6 Kapitel oder bei 3+ schwachen Kapiteln ausgelöst. Pausiert neue Kapitel für Wiederholung und Vertiefung.',
    consolidationMeaning:
      'Beseitigt die Illusion von Kompetenz und festigt Grundlagen.',
    rolloverTitle: 'Rollover-Regel (Keine Strafen)',
    rolloverBody:
      'Wird eine Wiederholung heute nicht abgehakt, wandert sie in den morgigen 06:00-Wecker, ohne das historische Datum zu verfälschen.',
    rolloverMeaning:
      'Hält offene Punkte sichtbar, ohne die Lerndatenhistorie zu verzerren.',
    blindRecallTitle: 'Freier Recall (Ohne Hilfsmittel)',
    blindRecallBody:
      'Wissensabfrage komplett ohne Spickzettel, Notizen oder Autovervollständigung.',
    blindRecallMeaning:
      'Maximaler kognitiver Abrufaufwand erzeugt beste Lernergebnisse.',
    adaptiveTitle: 'Adaptives Protokoll (Ohne Schuldgefühle)',
    adaptiveBody:
      'Wurde das Lernziel verfehlt, passt die Engine den nächsten Tag an, pausiert Neues und verhindert Lawineneffekte.',
    adaptiveMeaning: 'Nachhaltige Kontinuität schlägt starren Perfektionismus.',
  },
  guide: {
    tabTitle: 'So funktioniert die App (1-Wochen-Beispiel)',
    heroTitle: 'Der reproduzierbare Abend-Algorithmus',
    heroSubtitle:
      'Meistere jedes komplexe technische Thema in unter 60 Sekunden pro Abend – durch die direkte Kopplung von Spaced Repetition an deine Smartphone-Weckzeiten.',
    loadSimulationBtn: '1-Wochen-Beispiel in den Tracker laden',
    simulationLoadedNotice:
      'Beispielwoche wurde in deinen Lern-Tracker geladen! Sieh dir den Tracker oder die Abendentscheidung an.',
    philosophyTitle: '5 Kernprinzipien für maximale Lerneffizienz',
    principle1Title: '1. Weckzeiten nur einmalig am Smartphone einrichten',
    principle1Body:
      'Stelle die 8 Weckzeiten einmalig in deiner Smartphone-Uhr ein (06:00, 08:15, 09:30/10:00, 15:15, 16:15, 17:00, 19:30). Jeden Abend vor dem Schlafen generiert die App die exakten Beschriftungen. Einfach kopieren und einfügen. Null Reibung.',
    principle2Title: '2. Die Ebbinghaus-Spaced-Triade (T-3, T-7, T-14)',
    principle2Body:
      '• Flashcards T-3 (+3 Tage): Stoppt den steilen Gedächtnisabfall.\n• Diagnostik-Quiz T-7 (+7 Tage): Nutzt den Testeffekt zur Fehleraufdeckung.\n• Feynman-Recall T-14 (+14 Tage): Verankert Wissen durch freies Erklären.',
    principle3Title:
      '3. Konsolidierungs-Meilensteine (Schluss mit Kompetenz-Illusion)',
    principle3Body:
      'Alle 6 Kapitel ODER sobald 3+ Kapitel Schwachstellen aufweisen, stoppt der Algorithmus neue Lektionen. Der Tag gehört kapitelübergreifenden Tests, Code-Herausforderungen und Fehleranalysen.',
    principle4Title:
      '4. Adaptives Protokoll ohne Schuldgefühle (Volle Flexibilität)',
    principle4Body:
      'Bei Erschöpfung, Krankheit oder Notfällen: Keine Panik. Wähle „Ziele verfehlt“ – die Engine entlastet den Folgetag und pausiert neue Kapitel, um deine Motivation zu schützen.',
    principle5Title: '5. Die Rollover-Regel (Null Bestrafung)',
    principle5Body:
      'Bleibt eine Wiederholung heute unabgehakt, bleibt ihr ursprüngliches Datum unverändert. Sie wandert automatisch in den Wecker um 06:00 Uhr.',
    timelineTitle: 'Praktischer Wochenablauf (Montag bis Sonntag)',
    timelineSubtitle:
      'Erlebe, wie sich der Algorithmus Tag für Tag an Noten, unvollendeten Code, Ausfälle und Meilensteine anpasst.',
    monBadge: 'Montag · Start',
    monTitle: 'Kap. 1: TCP/IP-Architektur & Sockets',
    monWhatHappened:
      'Start des Themas Verteilte Systeme. Kapitel 1 sauber abgeschlossen. Quiz: 95 % (Sehr gut). Kein Code-Übertrag.',
    monAlgorithmReaction:
      'Die Engine registriert das Datum, kalkuliert T-3 (Do), T-7 (Mo), T-14 (Mo+1W) und plant Kap. 2 für morgen.',
    monAlarmPreview:
      'Morgen 06:00 -> T-3: Keine | T-7: Keine | NEU: Kap. 2 (Speicher & Zeiger)',
    tueBadge: 'Dienstag · Warnung: Schwachstelle!',
    tueTitle: 'Kap. 2: Speicherverwaltung & Zeigerarithmetik',
    tueWhatHappened:
      'Schwieriges Thema! Kapitel gelesen, aber Quiz nur 65 % (4 Fehler!) und Programmieraufgaben nicht beendet.',
    tueAlgorithmReaction:
      'Der Algorithmus markiert Kap. 2 automatisch als SCHWACH und ÜBERTRAG. Kap. 2 wird als Tandem für die Mittwochs-Coding-Session eingeplant.',
    tueAlarmPreview:
      'Morgen 10:00 -> Code: Kap. 2 (Übertrag / Schwach) + Kap. 3 (Nebenläufigkeit)',
    wedBadge: 'Mittwoch · Aufholen im Tandem',
    wedTitle: 'Kap. 3: Nebenläufigkeit & Lock-Free Caches',
    wedWhatHappened:
      'Kap. 3 abgeschlossen und der Zeiger-Bug aus Kap. 2 behoben. Quiz: 88 %.',
    wedAlgorithmReaction:
      'Setzt das Zielkapitel auf Kap. 4. Behält die Schwachstellen-Historie für die spätere Konsolidierung im Auge.',
    wedAlarmPreview:
      'Morgen ist Donnerstag -> Aktiviert die Zeitfenster und den IDE-Stopp um 15:15 Uhr.',
    thuBadge: 'Donnerstag · 1. T-3 Wiederholung fällig!',
    thuTitle: 'Kap. 4: Event Loops (+ Kap. 1 T-3)',
    thuWhatHappened:
      'Genau 3 Tage seit Montag vergangen! Kap. 1 ist FÄLLIG für die T-3 Karteikarten.',
    thuAlgorithmReaction:
      'Erkennt T-3 von Kap. 1 und speist es in den 06:00-Wecker ein. IDE-Stopp um 15:15 Uhr für passive Rekapitulation.',
    thuAlarmPreview:
      '06:00 -> Recall T-3/T-7 (Kap. 1) + NEU: Kap. 4 | 15:15 -> IDE SCHLIESSEN: Passive Durchsicht',
    friBadge: 'Freitag · Regeneration · Stopp um 15:15',
    friTitle: 'Kap. 5: WebSockets & Heartbeat-Monitore',
    friWhatHappened:
      'Grundlagen von Kap. 5 studiert. Quiz: 85 %. Regenerations-Vorgaben für Freitag greifen.',
    friAlgorithmReaction:
      'Konzentriert intensives Coden auf den Vormittag. Um 15:15 Uhr Feierabend: OFF – Erholung zur Auffüllung der Energiereserven.',
    friAlarmPreview:
      '15:15 -> OFF – Regeneration (Erholung für das Wochenende)',
    satBadge: 'Samstag · Ausfall (Adaptives Protokoll)',
    satTitle: 'Übertrag Kap. 5 & Unvorhergesehenes',
    satWhatHappened:
      'Starke Migräne und familiärer Notfall. Lernen war unmöglich.',
    satAlgorithmReaction:
      'Nutzer wählt „Ziele verfehlt“ -> „Erschöpfung“. Der Algorithmus stoppt neue Themen, nimmt jeden Druck und passt den Sonntag sanft an.',
    satAlarmPreview:
      'Morgen 06:00 -> SANFTER EINSTIEG: Kap. 5 (Grundlagen) | 08:15 -> Leichtes Repetieren',
    sunBadge: 'Sonntag · 6-Kapitel-Konsolidierungstag!',
    sunTitle: '6-Kapitel-Meilenstein erreicht',
    sunWhatHappened:
      'Kap. 5 entspannt abgeschlossen. Damit sind 6 Kapitel seit Beginn vollendet (Kap. 1 bis 6)!',
    sunAlgorithmReaction:
      'KONSOLIDIERUNG AUSGELÖST! Keine neuen Kapitel für morgen. Der gesamte Tag ist für Gesamttests, Praxischallenges und Feynman-Synthese reserviert.',
    sunAlarmPreview:
      '06:00 -> Konsolidierungs-Recall: Schwache Flashcards (Kap. 2) | 08:15 -> Gesamt-Quiz Kap. 1–6 | 10:00 -> Praxis-Challenge Kap. 1–6',
    routineTitle: 'Die tägliche 3-Schritte-Routine',
    morningTitle: '1. Aufwachen & Loslegen (06:00 - 06:45)',
    morningDesc:
      'Vom Weckertitel aufwecken lassen. 20 Minuten fällige T-3/T-7 Karteikarten durchgehen, danach 10 Minuten konzeptioneller Überblick über das Tageskapitel.',
    workTitle: '2. Praxis & Code (08:15 & 10:00)',
    workDesc:
      '08:15 Uhr: Diagnostik-Quiz ohne Notizen. 10:00 Uhr: Intensive Programmiereinheit, die gestrige Schwachstellen mit dem neuen Stoff verzahnt.',
    bedtimeTitle: '3. 60-Sekunden-Abendritual (22:30)',
    bedtimeDesc:
      'App auf dem Smartphone öffnen. 3 Fragen beantworten. „Alle kopieren“ antippen. In die morgigen Wecker einfügen. Entspannt schlafen gehen.',
  },
  topicModal: {
    modalTitleCreate: 'Thema anlegen & Lehrplan importieren',
    modalTitleEdit: 'Thema bearbeiten & Lehrplan verwalten',
    nameLabel: 'Name des Themas / Fachs',
    namePlaceholder:
      'z. B. Verteilte Systeme, Netzwerkarchitektur, Algorithmen...',
    descLabel: 'Beschreibung / Lernziele',
    descPlaceholder:
      'Kurze Zusammenfassung der Kernkonzepte (z. B. Raft/Paxos-Konsens, Fehlertoleranz, Caching).',
    colorLabel: 'Farbschema',
    syllabusLabel: 'Kapitelliste / Lehrplan (Optional – ein Kapitel pro Zeile)',
    syllabusPlaceholder:
      '1. Einführung in Verteilte Systeme\n2. RPC & Netzwerkerialisation\n3. Primär-Sekundär-Replikation\n4. Raft-Konsensalgorithmus\n5. Resiliente Key-Value-Speicher\n6. MapReduce & Parallele Berechnungen',
    syllabusHint:
      'Inhaltsverzeichnis deines Fachbuchs oder Lehrplans einfügen. Nummerierungen werden automatisch erkannt.',
    parsedCountNotice: 'Erkannte Kapitel bereit zum Importieren',
    scheduleModeLabel: 'Import-Modus für den Lehrplan',
    scheduleModeQueue:
      'In Warteschlange einreihen (Ungelernt, bereit für Abendrituale)',
    scheduleModeBackfill:
      'Als abgeschlossen eintragen (Sofort Spaced Reviews berechnen)',
    cancel: 'Abbrechen',
    save: 'Thema & Lehrplan speichern',
    docParserTitle: '📄 Lehrplan aus Datei extrahieren (n8n Workflow)',
    docParserSubtitle:
      'Lade beliebige Dokumente, Präsentationen, Tabellen oder Notizen (.md, .pdf, .docx, .xlsx, .pptx usw.) hoch, um Kapitel und Beschreibungen automatisch zu extrahieren.',
    docUploadLabel:
      'Datei hier ablegen oder auswählen (.md, .pdf, .docx, .xlsx, .pptx usw.)',
    docUploadHint:
      'Unterstützt alle gängigen Dateiformate: PDF, Markdown, Word, PowerPoint, Excel, CSV, Text. Direkte Erkennung oder über n8n Webhook.',
    docPromptLabel: 'KI-Extraktionsanweisung & Filter (Optional)',
    docPromptPlaceholder:
      'z. B. „Nur Kapitel 3 bis 7 extrahieren“, „Fokus auf Verteilte Systeme“, „Anhänge weglassen“',
    docPromptHint:
      'Die KI filtert und strukturiert den Lehrplan entsprechend deiner Anweisung.',
    parseErrorTitle: 'Fehler beim Dokument-Parsing',
    n8nWebhookUrlLabel: 'n8n Webhook-URL',
    n8nWebhookPlaceholder: 'http://localhost:5678/webhook/parse-chapter-doc',
    downloadWorkflowBtn: '📥 n8n Workflow herunterladen (.json)',
    parseBtn: '⚡ Kapitel extrahieren',
    parsingInProgress: 'Dokument wird analysiert…',
    parseSuccessNotice: 'Kapitel erfolgreich aus dem Dokument extrahiert!',
    parseErrorNotice:
      'Dokument konnte nicht verarbeitet werden. Bitte n8n Webhook oder Format prüfen.',
    workflowGuideTitle: 'So funktioniert es mit n8n:',
    workflowGuideStep1:
      '1. Lade die Workflow-JSON-Datei oben herunter und importiere sie in n8n.',
    workflowGuideStep2:
      '2. Aktiviere den Workflow in n8n (Webhook-Pfad: /webhook/parse-chapter-doc).',
    workflowGuideStep3:
      '3. Ziehe dein Dokument hierher, um Thema, Beschreibung und Kapitel automatisch zu befüllen!',
  },
  outlook: {
    title: '7-Tage-Vorausschau & Wiederholungs-Kollisionen',
    subtitle:
      'Vorausblick auf Häufungen von T-3, T-7 und T-14 Wiederholungen zur Wahrung deiner mentalen Frische',
    collisionAlert: 'Hohe Wiederholungsdichte (>= 3 Kapitel fällig)',
    milestoneAlert: 'Konsolidierungs-Meilenstein (6-Kapitel-Zyklus)',
    reviewsScheduled: 'geplante Wiederholungen',
    noReviews: 'Keine Wiederholungen anstehend',
    todayBadge: 'Heute Abend',
    tomorrowBadge: 'Morgen',
  },
  recallModal: {
    title: 'Aktiver Recall & Express-Flashcard-Diagnostik',
    subtitle:
      'Prüfe dein aktives Wissen, bevor du Aufzeichnungen oder Lösungen einsiehst',
    topicLabel: 'Thema',
    chapterLabel: 'Kapitel',
    quizScoreLabel: 'Letztes Quiz',
    errorNotesLabel: 'Dokumentierte Schwachstellen & Randfälle',
    promptChallengeTitle: 'Aktive Abruf-Herausforderung',
    d3PromptText:
      'Aktiver Recall: Schreibe oder nenne laut ohne Notizen die 3 Kernkonzepte, Formeln oder Architekturen dieser Lerneinheit.',
    d7PromptText:
      'Synthese & Vertiefung: Erkläre Randfälle, Fehlerszenarien und Querverbindungen zu früheren Kapiteln.',
    d14PromptText:
      'Feynman-Recall: Erkläre dieses Thema in unter 90 Sekunden mit einfachen Worten, als würdest du es einem Nachwuchskollegen beibringen.',
    actionMastered: 'Beherrscht ✓ (Als erledigt markieren)',
    actionReinforce: 'Vertiefen ⚠️ (Schwachstelle beibehalten)',
    close: 'Schließen',
  },
};
