import { CHAPTER_DOC_PARSER_RAW_JSON } from './n8n-workflow-raw';

export const CHAPTER_DOC_PARSER_WORKFLOW_JSON = CHAPTER_DOC_PARSER_RAW_JSON;

/**
 * Initiates browser download of the pre-built n8n Chapter Doc Parser workflow.
 */
export function downloadN8nWorkflowFile(): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([CHAPTER_DOC_PARSER_WORKFLOW_JSON], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chapter-doc-parser.n8n.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
