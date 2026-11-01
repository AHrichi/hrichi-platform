import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { FileDropzone } from './file-dropzone';

/**
 * Accessible drag-and-drop & file-picker ingestion zone with format badges
 * and token-driven light/dark theming.
 */
const meta: Meta<FileDropzone> = {
  title: 'Forms/FileDropzone',
  component: FileDropzone,
  args: {
    title: 'Drop your WhatsApp export here to begin analysis',
    description:
      'Upload a compressed .zip archive or _chat.txt transcript. Extracted 100% in browser memory.',
    accept: '.txt,.zip',
    icon: '📦',
    ctaLabel: '📂 Select WhatsApp .ZIP or .TXT File',
    badges: [
      '.ZIP Archive (Auto-Skips Media)',
      '.TXT Raw Export',
      'iOS & Android',
    ],
    loading: false,
    disabled: false,
  },
};
export default meta;

export const Default: StoryObj<FileDropzone> = {};

export const LoadingState: StoryObj<FileDropzone> = {
  args: {
    loading: true,
    loadingLabel: '⏳ Extracting & Parsing Transcript...',
  },
};
