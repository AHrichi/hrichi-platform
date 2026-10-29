import type { CompetencyTier } from './tier.model';

export type ElaborationMode = 'hint' | 'deep_dive';

export interface ElaborationNode {
  id: string;
  label: string;
  subtext?: string;
  type?: 'start' | 'process' | 'decision' | 'end' | 'highlight';
  badge?: string;
  icon?: string;
}

export interface ElaborationEdge {
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed';
}

export interface ElaborationGraph {
  title?: string;
  description?: string;
  direction?: 'horizontal' | 'vertical';
  nodes: ElaborationNode[];
  edges?: ElaborationEdge[];
  rawMermaid?: string;
}

export interface ElaborationCodeSnippet {
  code: string;
  language: string;
  filename?: string;
  explanation?: string;
}

export interface ConceptElaboration {
  id: string;
  mode: ElaborationMode;
  conceptTitle: string;
  sectionCode?: string;
  tier?: CompetencyTier;
  summary: string;
  bulletPoints: string[];
  codeSnippet?: ElaborationCodeSnippet;
  graph?: ElaborationGraph;
  officialDocs?: { title: string; url: string }[];
  provider: string;
  timestamp: string;
}

export interface ConceptElaborationRequest {
  action: 'elaborate_concept';
  mode: ElaborationMode;
  subject: string;
  conceptTitle: string;
  difficultyTier?: CompetencyTier;
  sectionCode?: string;
  promptOrQuestion: string;
  answerOrExplanation?: string;
  codeSnippet?: string;
}

export interface ConceptElaborationResponse {
  success: boolean;
  provider: string;
  elaboration: ConceptElaboration;
}
