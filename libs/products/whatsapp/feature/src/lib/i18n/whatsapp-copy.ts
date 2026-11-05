import type { SiteLanguage } from '@ah/shared/state';

export interface WhatsAppCopy {
  tabs: {
    overview: string;
    media: string;
    dynamics: string;
    lexical: string;
    heatmap: string;
    wrapped: string;
    aiInsights: string;
    transcript: string;
  };
  mediaLabels: {
    voiceAudio: string;
    photosImages: string;
    videos: string;
    stickersGifs: string;
    docsOther: string;
  };
}

export const WHATSAPP_COPY: Record<SiteLanguage, WhatsAppCopy> = {
  en: {
    tabs: {
      overview: 'Overview & Volume',
      media: 'Media & Voice Notes',
      dynamics: 'Reply Dynamics',
      lexical: 'Words & Emojis',
      heatmap: '7×24 Heatmap & Streaks',
      wrapped: 'Wrapped Card',
      aiInsights: 'n8n AI Insights',
      transcript: 'Transcript',
    },
    mediaLabels: {
      voiceAudio: '🎙️ Voice / Audio',
      photosImages: '🖼️ Photos / Images',
      videos: '🎬 Videos',
      stickersGifs: '✨ Stickers & GIFs',
      docsOther: '📄 Docs & Other',
    },
  },
  fr: {
    tabs: {
      overview: 'Vue d’ensemble & volume',
      media: 'Médias & notes vocales',
      dynamics: 'Dynamique des réponses',
      lexical: 'Mots & émojis',
      heatmap: 'Carte thermique 7×24 & séries',
      wrapped: 'Carte Wrapped',
      aiInsights: 'Analyses IA n8n',
      transcript: 'Transcription',
    },
    mediaLabels: {
      voiceAudio: '🎙️ Audio & messages vocaux',
      photosImages: '🖼️ Photos & images',
      videos: '🎬 Vidéos',
      stickersGifs: '✨ Autocollants & GIF',
      docsOther: '📄 Documents & divers',
    },
  },
  ar: {
    tabs: {
      overview: 'نظرة عامة وحجم المحادثة',
      media: 'الوسائط والملاحظات الصوتية',
      dynamics: 'ديناميكية وسرعة الردود',
      lexical: 'الكلمات والرموز التعبيرية',
      heatmap: 'خريطة النشاط 24/7',
      wrapped: 'بطاقة الحصاد (Wrapped)',
      aiInsights: 'تحليلات الذكاء الاصطناعي n8n',
      transcript: 'سجل المحادثة الكامل',
    },
    mediaLabels: {
      voiceAudio: '🎙️ صوتيات وملاحظات صوتية',
      photosImages: '🖼️ صور ولقطات',
      videos: '🎬 مقاطع فيديو',
      stickersGifs: '✨ ملصقات وصور متحركة',
      docsOther: '📄 مستندات وملفات أخرى',
    },
  },
  it: {
    tabs: {
      overview: 'Panoramica e volumi',
      media: 'Media e note vocali',
      dynamics: 'Dinamiche di risposta',
      lexical: 'Parole ed emoji',
      heatmap: 'Mappa di calore 7×24 e serie',
      wrapped: 'Card Wrapped',
      aiInsights: 'Insight AI n8n',
      transcript: 'Trascrizione',
    },
    mediaLabels: {
      voiceAudio: '🎙️ Audio e messaggi vocali',
      photosImages: '🖼️ Foto e immagini',
      videos: '🎬 Video',
      stickersGifs: '✨ Sticker e GIF',
      docsOther: '📄 Documenti e altri file',
    },
  },
  de: {
    tabs: {
      overview: 'Übersicht & Volumen',
      media: 'Medien & Sprachnachrichten',
      dynamics: 'Antwortdynamik',
      lexical: 'Wörter & Emojis',
      heatmap: '7×24 Heatmap & Serien',
      wrapped: 'Wrapped-Karte',
      aiInsights: 'n8n KI-Analysen',
      transcript: 'Transkript',
    },
    mediaLabels: {
      voiceAudio: '🎙️ Audio & Sprachnachrichten',
      photosImages: '🖼️ Fotos & Bilder',
      videos: '🎬 Videos',
      stickersGifs: '✨ Sticker & GIFs',
      docsOther: '📄 Dokumente & Sonstiges',
    },
  },
};
