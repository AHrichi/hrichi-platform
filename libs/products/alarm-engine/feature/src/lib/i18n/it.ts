import type { AlarmEngineDictionary } from './i18n.types';

export const itDictionary: AlarmEngineDictionary = {
  meta: {
    title: 'Motore Decisionale Sveglie Notturne',
    tagline:
      'Il tuo algoritmo serale in 60 secondi: registra lo studio quotidiano, calcola automaticamente le ripetizioni spaziate G-3/G-7/G-14, rileva i cicli di consolidamento e copia i titoli esatti delle sveglie sul telefono.',
    badgeAlgorithm: 'Algoritmo Serale',
    badgeDarkMode: 'Modalità Scura & Chiara',
    badgeSpacedRepetition: 'Ripetizione Spaziata G-3 / G-7 / G-14',
  },
  actions: {
    jsonBackup: 'Backup JSON',
    resetChecklist: 'Reimposta Checklist',
    clearData: 'Cancella Tutti i Dati',
    loadDemoData: 'Carica Dati Demo',
    saveAndCommit: 'Salva e Conferma Rituale Serale',
    copyAll: 'Copia Tutto',
    copySlot: 'Copia',
    downloadIcs: 'Esporta .ics',
    quickRecall: 'Richiamo Rapido',
    addChapter: 'Nuovo Capitolo',
    editChapter: 'Modifica',
    deleteChapter: 'Elimina',
    toggleTheme: 'Cambia Tema',
    language: 'Lingua',
    viewAllTopics: 'Tutti gli Argomenti',
    newTopic: '+ Argomento / Programma',
    editTopic: 'Modifica Argomento',
  },
  stepsGuide: {
    step1Title: 'Bilancio del Giorno',
    step1Desc:
      'Registra il capitolo completato oggi, il punteggio al quiz ed eventuali task di codice in sospeso.',
    step2Title: 'Ripetizioni Spaziate',
    step2Desc:
      'Spunta le flashcard in scadenza. Le revisioni non completate slittano automaticamente senza stress.',
    step3Title: 'Copia Sveglie',
    step3Desc:
      'Copia con 1 clic i titoli generati direttamente nelle tue sveglie ricorrenti sullo smartphone.',
  },
  kpi: {
    tomorrowProtocol: 'Protocollo di Domani',
    targetChapter: 'Capitolo Obiettivo',
    nextStep: 'Prossimo step di avanzamento',
    activeWeakChapters: 'Capitoli Fragili Attivi',
    flaggedReinforce: 'segnalati da rinforzare',
    milestoneConsolidation: 'Ciclo Consolidamento',
    chaptersLeft: 'cap. rimanenti',
    cycle6Ch: 'ciclo di 6 capitoli',
    topicFilter: 'Ambito Argomento',
  },
  nav: {
    decision: 'Decisione Serale',
    tracker: 'Registro Studio',
    guide: 'Guida & Esempio 1 Settimana',
    reference: 'Guida 8 Sveglie Telefono',
    decisionShort: 'Decisione',
    trackerShort: 'Registro',
    guideShort: 'Guida',
    referenceShort: 'Sveglie',
  },
  collapse: {
    collapse: 'Comprimi sezione',
    expand: 'Espandi sezione',
    collapsedSummary: 'Clicca per espandere questa sezione',
  },
  notifications: {
    title: 'Notifiche Push Sveglie',
    subtitle:
      'Ricevi notifiche nel browser sincronizzate con gli orari esatti delle tue sveglie (06:00, 08:15, 10:00, ecc.)',
    enableBtn: 'Attiva Notifiche',
    disableBtn: 'Disattiva Notifiche',
    testBtn: '🔔 Prova Notifica',
    statusGranted: 'Attiva & Pianificata',
    statusDenied: 'Bloccata nel Browser',
    statusDefault: 'Autorizzazione Necessaria',
    statusUnsupported: 'Browser Non Supportato',
    nextAlarmAlert: 'Prossimo allarme programmato',
    testNotificationTitle: '⏰ Test Notifica Alarm Engine',
    testNotificationBody:
      'Le notifiche push funzionano! Riceverai gli avvisi negli orari esatti delle tue sveglie domani.',
    permissionDeniedNotice:
      'Le notifiche sono bloccate nelle impostazioni del browser. Abilitale per questo sito.',
    enabledNotice:
      'Notifiche push attivate! Gli avvisi suoneranno agli orari pianificati.',
    disabledNotice: 'Notifiche push disattivate.',
  },
  checklist: {
    title: 'Checklist del Rituale Serale',
    resetTooltip: 'Reimposta la checklist in 9 passaggi a 0/9',
    step1:
      '1. Registra il capitolo completato oggi e la data di studio iniziale',
    step2: '2. Registra il punteggio del quiz e i capitoli fragili',
    step3: '3. Controlla i capitoli in scadenza per le flashcard G-3',
    step4: '4. Controlla i capitoli in scadenza per i quiz diagnostici G-7',
    step5: '5. Controlla i capitoli per il richiamo orale Feynman G-14',
    step6: '6. Determina la tipologia di giornata per domani',
    step7: '7. Verifica se domani è una giornata di consolidamento',
    step8: '8. Genera e aggiorna i titoli delle sveglie',
    step9: '9. Verifica gli orari delle sveglie nell’app Orologio del telefono',
  },
  questionnaire: {
    title: 'Diagnostica Serale',
    subtitle: 'Rispondi a 3 brevi domande sulle sessioni di studio svolte oggi',
    tonightDate: 'Data di Stasera',
    defaultsToday: 'Predefinito data odierna',
    topic: 'Materia / Argomento',
    targetChapterNum: 'N° Capitolo Obiettivo',
    targetChapterTitle: 'Titolo Capitolo / Sotto-argomento',
    targetChapterTitlePlaceholder: 'Es: Alberi B & LSM-Tree, Protocolli TCP...',
    highestCompletedPlusOne: 'Ultimo completato + 1 predefinito',
    didYouFinish: 'Hai completato il capitolo previsto per oggi?',
    optFinished: 'Capitolo Completato',
    optRepeat: 'Ripeti Capitolo',
    optConsolidation: 'Consolidamento Completato',
    optMissed: 'Obiettivi Mancati / Rallentamento',
    advancesNotice:
      'Avanza al capitolo successivo per domani e pianifica le revisioni G-3, G-7 e G-14.',
    repeatNotice:
      'Mantiene questo capitolo domani per consolidare la padronanza prima di proseguire.',
    consolidationNotice:
      'Completa il traguardo di consolidamento su 6 capitoli, azzera gli allarmi e riprende nuovi argomenti.',
    missedNotice:
      'Protocollo adattivo attivato: sospende i nuovi capitoli, alleggerisce il carico di domani e previene il sovraccarico.',
    missedReasonLabel: 'Cosa è successo oggi?',
    missedReasonOffTrack:
      'Distrazione / Fuori pista (Recupero mirato a blocchi)',
    missedReasonOverwhelmed:
      'Affaticamento Mentale / Sovraccarico (Alleggerimento graduale)',
    missedReasonEmergency: 'Emergenza / Malattia (Giornata di Recupero)',
    quizPerformance: 'Rendimento al Quiz',
    strongPass: 'Superato brillantemente (>= 75%)',
    weakWarning: 'Soglia fragile (< 75% o >= 3 errori)',
    questionsMissed: 'Domande Sbagliate',
    quizScore: 'Punteggio Quiz (%)',
    codingProgress: 'Avanzamento Codice del Giorno',
    codingClean: 'Completato con Successo',
    codingCarryover: 'Incompleto — Rimandato a Domani',
    spacedReviewsDue: 'Ripetizioni Spaziate in Scadenza Stasera',
    rolloverRuleTitle: 'Regola del Rollover (Slittamento Senza Penalità)',
    rolloverRuleDesc:
      'Se lasci una revisione non spuntata stasera, la sua data originale non cambia MAI; viene integrata automaticamente nella sveglia delle 06:00 di domani.',
    noReviewsDue: '🎉 Nessuna ripetizione spaziata in sospeso per stasera!',
    errorNotesLabel: 'Punti Fragili / Note di Errore',
    errorNotesPlaceholder:
      'Es: Gestione errori async/await, aritmetica dei puntatori...',
    errorNotesHint:
      'Inserito direttamente nei titoli dei test e refactoring di domani.',
    tomorrowDayType: 'Selettore Tipologia Giornata di Domani',
  },
  schedule: {
    title: 'Programma Sveglie di Domani',
    subtitle: 'Titoli esatti generati per le tue sveglie ricorrenti',
    oneMinuteSetupNotice:
      'Imposta le tue sveglie ricorrenti una volta per tutte nell’app Orologio dello smartphone. Ogni sera prima di dormire, copia e incolla i titoli in meno di 60 secondi!',
    copiedToast: 'Copiato negli appunti: ',
    allCopiedToast: 'Tutti i titoli delle sveglie sono stati copiati!',
  },
  tracker: {
    title: 'Registro di Studio (Registro Immutabile)',
    subtitle:
      'Date storiche immutabili, scadenze di ripetizione spaziata e punteggi',
    emptyTitle: 'Nessun Capitolo Registrato',
    emptyDesc:
      'Inizia con un piano ordinato! Completa il rituale di stasera o clicca su "Nuovo Capitolo" per registrare la prima lezione.',
    startFirstChapter: 'Aggiungi 1° Capitolo',
    filterAll: 'Tutti i Capitoli',
    filterWeak: 'Solo Fragili',
    filterDue: 'In Scadenza',
    filterCarryover: 'Codice Rimandato',
    thChapter: 'Capitolo',
    thTopic: 'Argomento',
    thStudied: 'Studiato il',
    thD3: 'G-3 (Flashcard)',
    thD7: 'G-7 (Quiz)',
    thD14: 'G-14 (Orale)',
    thQuiz: 'Punteggio',
    thStatus: 'Stato',
    thNotes: 'Note Errori',
    thActions: 'Azioni',
    badgeDue: 'SCADUTO',
    badgeDone: 'FATTO ✓',
    badgePending: 'IN ATTESA',
    badgeWeak: 'FRAGILE',
    badgeCarryover: 'RIMANDATO',
  },
  modal: {
    addChapterTitle: 'Aggiungi Capitolo',
    editChapterTitle: 'Modifica Capitolo',
    chapterNumber: 'Numero Capitolo',
    chapterTitle: 'Titolo Capitolo',
    topic: 'Argomento / Materia',
    studyDate: 'Data di Studio Iniziale',
    autoFillNotice:
      '⚡ Le scadenze G-3 (+3gg), G-7 (+7gg) e G-14 (+14gg) vengono calcolate automaticamente non appena selezioni la data di studio.',
    d3Label: 'Data G-3 (Flashcard)',
    d7Label: 'Data G-7 (Quiz)',
    d14Label: 'Data G-14 (Richiamo Orale)',
    quizScore: 'Punteggio Quiz (%)',
    questionsMissed: 'Domande Sbagliate',
    codingCarryover: 'Codice Rimandato',
    errorNotes: 'Note Errori / Concetti Fragili',
    cancel: 'Annulla',
    save: 'Salva',
    backupTitle: 'Backup & Ripristino JSON',
    backupDesc:
      'Copia il tuo backup JSON o incolla una copia precedente per ripristinare completamente i tuoi dati di studio.',
    copyJson: 'Copia JSON',
    importJson: 'Importa JSON',
    uploadFile: 'Carica File (.json)',
  },
  tooltips: {
    d3Title: 'Richiamo G-3 (Flashcard)',
    d3Body:
      'Primo intervallo di ripetizione spaziata (+3 giorni). Ripassa le flashcard per arrestare il crollo iniziale della curva dell’oblio.',
    d3Formula: 'dataStudio + 3 giorni',
    d3Meaning: 'Stabilizza le nuove connessioni sinaptiche prima dell’oblio.',
    d7Title: 'Quiz Diagnostico G-7',
    d7Body:
      'Secondo intervallo (+7 giorni). Test di auto-valutazione per verificare la comprensione e isolare i punti deboli.',
    d7Formula: 'dataStudio + 7 giorni',
    d7Meaning: 'La pratica di recupero attivo rafforza la traccia mnestica.',
    d14Title: 'Richiamo Orale Feynman G-14',
    d14Body:
      'Terzo intervallo (+14 giorni). Spiegazione sintetica a libro chiuso per consolidare la memoria a lungo termine.',
    d14Formula: 'dataStudio + 14 giorni',
    d14Meaning:
      'Convalida la padronanza concettuale profonda attraverso l’insegnamento.',
    consolidationTitle: 'Giornata di Consolidamento',
    consolidationBody:
      'Si attiva ogni 6 capitoli completati o quando ci sono 3+ capitoli fragili. Sospende i nuovi argomenti per ripassare e programmare.',
    consolidationMeaning:
      'Elimina l’illusione di competenza e consolida le fondamenta.',
    rolloverTitle: 'Regola del Rollover (Zero Penalità)',
    rolloverBody:
      'Una revisione non spuntata stasera viene rimandata nella sveglia delle 06:00 di domani senza alterare la data storica.',
    rolloverMeaning:
      'Mantiene la visibilità dei compiti arretrati senza falsare lo storico.',
    blindRecallTitle: 'Richiamo alla Cieca (Blind Recall)',
    blindRecallBody:
      'Pratica di recupero svolta senza consultare appunti o completamento automatico.',
    blindRecallMeaning:
      'Massimizza lo sforzo cognitivo per un apprendimento duraturo.',
    adaptiveTitle: 'Protocollo Adattivo (Zero Sensi di Colpa)',
    adaptiveBody:
      'Se gli obiettivi non sono stati raggiunti, l’app alleggerisce la giornata di domani evitando l’effetto valanga.',
    adaptiveMeaning:
      'La costanza sostenibile supera la perfezione inflessibile.',
  },
  guide: {
    tabTitle: 'Come usare l’app (Esempio 1 Settimana)',
    heroTitle: 'L’Algoritmo Notturno Ripetibile',
    heroSubtitle:
      'Padroneggia qualsiasi argomento tecnico complesso in meno di 60 secondi ogni sera collegando la scienza della ripetizione spaziata direttamente alle sveglie del tuo telefono.',
    loadSimulationBtn: 'Carica Esempio di 1 Settimana nel Registro',
    simulationLoadedNotice:
      'Esempio di una settimana caricato nel tuo Registro di Studio! Esplora il Registro o la Decisione Serale.',
    philosophyTitle: '5 Principi Chiave per la Massima Efficacia',
    principle1Title: '1. Imposta le sveglie una sola volta sul telefono',
    principle1Body:
      'Configura le 8 sveglie ricorrenti una volta per tutte nell’app Orologio (06:00, 08:15, 09:30/10:00, 15:15, 16:15, 17:00, 19:30). Ogni sera prima di dormire, l’app genera i titoli esatti. Copiali e incollali nel rispettivo slot. Zero attrito.',
    principle2Title: '2. La Triade Spaziata di Ebbinghaus (G-3, G-7, G-14)',
    principle2Body:
      '• Flashcard G-3 (+3gg): arresta il rapido decadimento iniziale della memoria.\n• Quiz Diagnostico G-7 (+7gg): sfrutta l’effetto testing per isolare i dubbi.\n• Richiamo Orale Feynman G-14 (+14gg): ancora il sapere spiegando a voce senza appunti.',
    principle3Title:
      '3. Traguardi di Consolidamento (Fine dell’Illusione di Competenza)',
    principle3Body:
      'Ogni 6 capitoli completati OPPURE non appena 3+ capitoli sono fragili, l’algoritmo blocca le nuove lezioni. La giornata si trasforma in quiz incrociato sui 6 capitoli, sfida pratica di codice e analisi degli errori.',
    principle4Title:
      '4. Protocollo Adattivo Zero Sensi di Colpa (Flessibilità Totale)',
    principle4Body:
      'In caso di imprevisto, malattia o stanchezza mentale, niente panico. Seleziona "Obiettivi Mancati": l’app alleggerisce la giornata di domani e sospende i nuovi capitoli per preservare il tuo slancio.',
    principle5Title: '5. La Regola del Rollover (Zero Penalità)',
    principle5Body:
      'Se una revisione in scadenza non viene spuntata stasera, la sua data originaria non cambia MAI. Viene automaticamente inserita nel titolo della sveglia delle 06:00 di domani.',
    timelineTitle: 'Simulazione Reale di 1 Settimana (Lunedì - Domenica)',
    timelineSubtitle:
      'Scopri come l’algoritmo si adatta giorno per giorno a punteggi fragili, imprevisti e consolidamento.',
    monBadge: 'Lunedì · Avvio Giornata Standard',
    monTitle: 'Cap. 1: Architettura TCP/IP & Socket',
    monWhatHappened:
      'Inizio dell’argomento Sistemi Distribuiti. Capitolo 1 completato con ordine. Quiz: 95% (Ottimo). Nessun codice rimandato.',
    monAlgorithmReaction:
      'L’algoritmo registra la data, calcola in automatico G-3 (Gio), G-7 (Lun), G-14 (Lun+1sett) e prepara il Cap. 2 per domani.',
    monAlarmPreview:
      'Domani 06:00 -> G-3: Nessuno | G-7: Nessuno | NUOVO: Cap. 2 (Memoria & Puntatori)',
    tueBadge: 'Martedì · Giornata Standard · Allerta Capitolo Fragile!',
    tueTitle: 'Cap. 2: Gestione Memoria & Aritmetica dei Puntatori',
    tueWhatHappened:
      'Argomento tosto! Capitolo letto, ma punteggio al Quiz del 65% (4 errori!) ed esercizi di codice incompiuti.',
    tueAlgorithmReaction:
      'L’algoritmo contrassegna automaticamente il Cap. 2 come FRAGILE e RIMANDATO. Pianifica il Cap. 2 in coppia nella sessione di codice di mercoledì.',
    tueAlarmPreview:
      'Domani 10:00 -> Codice: Cap. 2 (Rimandato / Fragile) + Cap. 3 (Concorrenza)',
    wedBadge: 'Mercoledì · Risoluzione in Coppia',
    wedTitle: 'Cap. 3: Concorrenza & Cache Lock-Free',
    wedWhatHappened:
      'Cap. 3 terminato e bug sui puntatori del Cap. 2 risolto durante il blocco di codice. Quiz: 88%.',
    wedAlgorithmReaction:
      'Avanza al Cap. 4. Conserva lo storico fragile per il prossimo ciclo di consolidamento.',
    wedAlarmPreview:
      'Domani è Giovedì -> Attiva gli slot dedicati e l’arresto IDE anticipato alle 15:15.',
    thuBadge: 'Giovedì · 1ª Revisione G-3 in Scadenza!',
    thuTitle: 'Cap. 4: Event Loop (+ Cap. 1 G-3)',
    thuWhatHappened:
      'Sono trascorsi esattamente 3 giorni da lunedì! Il Cap. 1 è IN SCADENZA per le flashcard G-3.',
    thuAlgorithmReaction:
      'Rileva il G-3 del Cap. 1 e lo inserisce nella sveglia delle 06:00. Applica la chiusura IDE alle 15:15 per revisione concettuale passiva.',
    thuAlarmPreview:
      '06:00 -> Richiamo G-3/G-7 (Cap. 1) + NUOVO: Cap. 4 | 15:15 -> CHIUDI IDE: Revisione Passiva',
    friBadge: 'Venerdì · Recupero & Chiusura alle 15:15',
    friTitle: 'Cap. 5: WebSocket & Monitor Heartbeat',
    friWhatHappened:
      'Studio delle basi del Cap. 5. Quiz: 85%. Chiusura protetta del venerdì attiva.',
    friAlgorithmReaction:
      'Limita le sessioni di programmazione intensiva al mattino. Alle 15:15 stacco totale: OFF — Riposo per ricaricare le energie cognitive.',
    friAlarmPreview:
      '15:15 -> OFF — Recupero (Riposo completo per il fine settimana)',
    satBadge: 'Sabato · Obiettivo Mancato (Protocollo Adattivo)',
    satTitle: 'Slittamento Cap. 5 & Imprevisto Familiare',
    satWhatHappened:
      'Forte emicrania e impegno imprevisto. Impossibile studiare come programmato.',
    satAlgorithmReaction:
      'L’utente seleziona "Obiettivi Mancati" -> "Affaticamento Mentale". L’algoritmo sospende i nuovi corsi, elimina ogni colpa e adatta la domenica.',
    satAlarmPreview:
      'Domani 06:00 -> RECUPERO SOFT: Cap. 5 (Basi Leggere) | 08:15 -> Ripasso Dolce (Senza Pressione)',
    sunBadge: 'Domenica · Giornata di Consolidamento 6 Capitoli!',
    sunTitle: 'Traguardo dei 6 Capitoli Raggiunto',
    sunWhatHappened:
      'Cap. 5 completato con serenità. Sono 6 capitoli completati dall’inizio (Cap. 1-6)!',
    sunAlgorithmReaction:
      'ATTIVAZIONE CONSOLIDAMENTO! Nessun nuovo capitolo domani. L’intera giornata è dedicata a quiz incrociato, sfida pratica e sintesi Feynman.',
    sunAlarmPreview:
      '06:00 -> Richiamo Consolidamento: Flashcard Fragili (Cap. 2) | 08:15 -> Quiz Incrociato Cap. 1–6 | 10:00 -> Sfida Codice Cap. 1–6',
    routineTitle: 'La Routine Quotidiana in 3 Passaggi',
    morningTitle: '1. Risveglio & Avvio (06:00 - 06:45)',
    morningDesc:
      'Svegliati leggendo il titolo della sveglia. Fai 20 min di flashcard G-3/G-7 in scadenza, poi 10 min di panoramica concettuale del capitolo del giorno.',
    workTitle: '2. Pratica & Codice (08:15 & 10:00)',
    workDesc:
      '08:15: Quiz diagnostico a libro chiuso. 10:00: Sessione di programmazione intensiva che combina le nozioni fragili di ieri al nuovo corso.',
    bedtimeTitle: '3. Rituale Serale in 60 Secondi (22:30)',
    bedtimeDesc:
      'Apri questa applicazione sullo smartphone. Tocca 3 risposte. Clicca su "Copia Tutto". Incolla nelle sveglie di domani. Dormi con la mente serena.',
  },
  topicModal: {
    modalTitleCreate: 'Crea Argomento & Importa Programma',
    modalTitleEdit: 'Modifica Argomento & Gestisci Programma',
    nameLabel: 'Nome Argomento / Corso',
    namePlaceholder: 'es: Sistemi Distribuiti, Architettura Reti, Algoritmi...',
    descLabel: 'Descrizione / Obiettivi di Apprendimento',
    descPlaceholder:
      'Breve riassunto dei concetti chiave (es: Consenso Raft/Paxos, tolleranza ai guasti, caching).',
    colorLabel: 'Colore Tema',
    syllabusLabel: 'Elenco Capitoli / Programma (Opzionale - Uno per riga)',
    syllabusPlaceholder:
      '1. Introduzione ai Sistemi Distribuiti\n2. RPC & Serializzazione di Rete\n3. Replicazione Primario-Secondario\n4. Algoritmo di Consenso Raft\n5. Storage Chiave-Valore Resiliente\n6. MapReduce & Calcolo Parallelo',
    syllabusHint:
      'Incolla l’indice del libro di testo o il programma del corso. La numerazione viene rilevata in automatico.',
    parsedCountNotice: 'Capitoli rilevati pronti per essere importati',
    scheduleModeLabel: 'Modalità di Importazione Programma',
    scheduleModeQueue:
      'Aggiungi in coda (Da studiare, pronti per le sessioni serali)',
    scheduleModeBackfill:
      'Registra come completati (Genera subito le ripetizioni spaziate)',
    cancel: 'Annulla',
    save: 'Salva Argomento & Programma',
    docParserTitle: '📄 Estrai Programma da Qualsiasi File (Workflow n8n)',
    docParserSubtitle:
      'Carica qualsiasi documento, presentazione, foglio di calcolo o appunto (.md, .pdf, .docx, .xlsx, .pptx, ecc.) per estrarre automaticamente capitoli e descrizioni senza digitarli a mano.',
    docUploadLabel:
      'Trascina o Seleziona Qualsiasi File (.md, .pdf, .docx, .xlsx, .pptx, ecc.)',
    docUploadHint:
      'Supporta tutti i tipi di file: PDF, Markdown, Word, PowerPoint, Excel, CSV, Testo. Estrazione diretta o tramite webhook n8n.',
    docPromptLabel: 'Prompt di Estrazione IA & Filtro Sezioni (Opzionale)',
    docPromptPlaceholder:
      'es. "Estrai solo i capitoli da 3 a 7", "Concentrati sui sistemi distribuiti", "Escludi le appendici"',
    docPromptHint:
      'L’intelligenza artificiale filtrerà e adatterà il programma secondo le tue istruzioni.',
    parseErrorTitle: 'Errore di Estrazione del Documento',
    n8nWebhookUrlLabel: 'URL Webhook n8n',
    n8nWebhookPlaceholder: 'http://localhost:5678/webhook/parse-chapter-doc',
    downloadWorkflowBtn: '📥 Scarica Workflow n8n (.json)',
    parseBtn: '⚡ Estrai Capitoli',
    parsingInProgress: 'Estrazione in corso…',
    parseSuccessNotice: 'Capitoli estratti con successo dal documento!',
    parseErrorNotice:
      'Impossibile analizzare il documento. Verifica il webhook n8n o il formato.',
    workflowGuideTitle: 'Come usarlo con n8n:',
    workflowGuideStep1:
      '1. Scarica il file JSON del workflow qui sopra e importalo nella tua istanza n8n.',
    workflowGuideStep2:
      '2. Attiva il workflow in n8n (Percorso webhook: /webhook/parse-chapter-doc).',
    workflowGuideStep3:
      '3. Rilascia il documento qui per compilare in automatico argomento, riassunto e capitoli!',
  },
  outlook: {
    title: 'Previsioni a 7 Giorni & Rilevamento Sovrapposizioni',
    subtitle:
      'Anticipa i cumuli di revisioni G-3, G-7 e G-14 per mantenere costante la lucidità mentale',
    collisionAlert: 'Forte Sovrapposizione di Revisioni (>= 3 capitoli)',
    milestoneAlert: 'Traguardo di Consolidamento (Ciclo 6 lezioni)',
    reviewsScheduled: 'revisioni programmate',
    noReviews: 'Nessuna revisione programmata',
    todayBadge: 'Stasera',
    tomorrowBadge: 'Domani',
  },
  recallModal: {
    title: 'Diagnostica di Richiamo Attivo & Flashcard Express',
    subtitle:
      'Metti alla prova la memoria prima di consultare appunti o soluzioni',
    topicLabel: 'Argomento',
    chapterLabel: 'Capitolo',
    quizScoreLabel: 'Ultimo Quiz',
    errorNotesLabel: 'Punti Fragili & Casi Limite Registrati',
    promptChallengeTitle: 'Sfida di Restituzione Attiva',
    d3PromptText:
      'Richiamo Attivo: Senza guardare gli appunti, scrivi o enuncia ad alta voce i 3 concetti fondamentali, formule o architetture di questo capitolo.',
    d7PromptText:
      'Sintesi & Analisi: Spiega i casi limite, le condizioni d’errore e i collegamenti con i capitoli precedenti.',
    d14PromptText:
      'Richiamo Orale Feynman: Insegna questo argomento in meno di 90 secondi usando parole semplici come se spiegassi a un collega junior.',
    actionMastered: 'Padroneggiato ✓ (Segna come Completato)',
    actionReinforce: 'Da Rinforzare ⚠️ (Mantieni Fragile)',
    close: 'Chiudi',
  },
};
