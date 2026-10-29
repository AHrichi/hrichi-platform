export type SourceType = 'document' | 'slide' | 'link' | 'note';

export interface StudySource {
  id: string;
  title: string;
  type: SourceType;
  content: string;
  url?: string;
  wordCount: number;
  addedAt: string;
  updatedAt?: string;
  summary?: string;
}

export interface AddSourceInput {
  title: string;
  type: SourceType;
  content: string;
  url?: string;
}

export interface UpdateSourceInput {
  id: string;
  title: string;
  type: SourceType;
  content: string;
  url?: string;
}
