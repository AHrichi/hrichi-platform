// Multilingual lexicons (English, French, Arabic / Tunisian Derja, Spanish),
// shared by the analytics engine and the wellbeing module.
export const LAUGHTER_REGEX =
  /\b(h+a+h+a+|h+e+h+e+|l+o+l+|l+m+a+o+|rofl|m+d+r+|p+t+d+r+|j+a+j+a+|h{3,})\b|[😂🤣😹💀😆]|ه{3,}/giu;

export const AFFECTION_REGEX =
  /\b(love|miss\s+you|adore|sweetheart|darling|babe|baby|honey|xoxo|bisou|bisous|chéri|cheri|chérie|cherie|mon\s+coeu?r|mon\s+amour|je\s+t'aime|habibi|habibti|hbibi|nhbek|nhebek|n7ebek|nmout\s+alik|3aychek|ya\s+rouhi|rou7i|te\s+amo|te\s+quiero)\b|[❤♥❣]️?|[🧡💛💚💙💜🖤🤍🤎💖💗💓💞💕🥰😘😍🫶]|حبيبي|حبيبتي|نحبك|توحشتك|روحي/giu;

export const APOLOGY_REGEX =
  /\b(sorry|apologize|apologies|my\s+bad|forgive\s+me|pardon|désolé|desole|désolée|desolee|excuse[-\s]?moi|smahni|sma7ni|samahni|perdon|perdón|lo\s+siento)\b|سامحني|اسف|آسف|معذرة/giu;

export const GRATITUDE_REGEX =
  /\b(thanks|thank\s+you|thx|tysm|appreciate\s+it|grateful|merci|chokran|shukran|aychek|3aychek|baraka\s+allahu|yrham\s+waldik|gracias)\b|[🙏]|شكرا|شكراً|عيشك|يعطيك\s+الصحة|بارك\s+الله/giu;

export const POSITIVE_SENTIMENT_REGEX =
  /\b(good|great|awesome|amazing|happy|glad|perfect|wonderful|excited|nice|best|beautiful|super|cool|yes|yay|bravo|parfait|génial|genial|magnifique|superbe|content|heureux|heureuse|top|grave|bien|behi|bahi|mezyen|mahleh|ma7leh|farhan|hmd|hamdoullah|elhamdoulilah|mabrouk|saha|excelente|genial|bueno)\b|[😊😄😁🥳🎉✨🔥👍👏💪🙌🤩]|الحمد\s+لله|مبروك|ممتاز|رائع|باهي|مزيان/giu;

export const NEGATIVE_SENTIMENT_REGEX =
  /\b(bad|sad|angry|upset|tired|exhausted|hate|annoyed|frustrated|worried|anxious|stressed|sick|hurt|awful|terrible|worst|non|triste|fâché|fache|énervé|enerve|fatigué|fatigue|malade|peur|stressé|grave\s+mal|dommage|nul|ta3ben|mridh|karez|mkarez|faddit|fadd|khayeb|malo|triste|cansado)\b|[😢😭😡🤬😠😞😔😟💔😩😫😤]|تعبان|مريض|حزين|قلقان|خايب/giu;

export function countRegexMatches(text: string, regex: RegExp): number {
  if (!text) return 0;
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

export interface MessageSentimentScore {
  positiveHits: number;
  negativeHits: number;
  /** -1 (negative), 0 (neutral) or 1 (positive), as the analytics engine classifies a message. */
  polarity: -1 | 0 | 1;
}

/** Scores one message with the same rule the analytics engine uses for its sentiment shares. */
export function scoreMessageSentiment(text: string): MessageSentimentScore {
  const positiveHits =
    countRegexMatches(text, POSITIVE_SENTIMENT_REGEX) +
    countRegexMatches(text, AFFECTION_REGEX) +
    countRegexMatches(text, LAUGHTER_REGEX) +
    countRegexMatches(text, GRATITUDE_REGEX);
  const negativeHits = countRegexMatches(text, NEGATIVE_SENTIMENT_REGEX);
  const polarity =
    positiveHits > negativeHits ? 1 : negativeHits > positiveHits ? -1 : 0;
  return { positiveHits, negativeHits, polarity };
}
