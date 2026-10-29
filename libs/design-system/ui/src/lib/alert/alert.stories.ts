import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { Alert } from './alert';

/**
 * Semantic alert banners for guardrail warnings, system messages, and confirmation notices.
 */
const meta: Meta<Alert & { message?: string }> = {
  title: 'Feedback/Alert',
  component: Alert,
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 640px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
        <ah-alert
          [variant]="variant"
          [title]="title"
          [dismissible]="dismissible"
        >
          {{ message }}
        </ah-alert>
      </div>
    `,
  }),
  args: {
    variant: 'info',
    title: 'Curriculum Roadmap Generated',
    message: 'Review the branches and approve sections before generating flashcards and quizzes.',
    dismissible: true,
  },
};
export default meta;

export const Default: StoryObj<Alert & { message: string }> = {};

export const VariantsGallery: StoryObj<Alert> = {
  render: () => ({
    template: `
      <div style="max-width: 640px; display: flex; flex-direction: column; gap: 1rem;">
        <ah-alert variant="info" title="Software Engineering Scoped">
          StudyLM decomposes topics into atomic sections to ensure deep, hallucination-free generation.
        </ah-alert>
        <ah-alert variant="success" title="Generation Complete">
          Successfully generated 18 flashcards for Section 1.1 grounded in MDN documentation.
        </ah-alert>
        <ah-alert variant="warning" title="Model Rate Limit Warning">
          Switched primary generation to backup model Groq Llama 3.3 70B after Gemini hit 429 quota.
        </ah-alert>
        <ah-alert variant="danger" title="Non-Software Engineering Subject" [dismissible]="true">
          StudyLM is strictly specialized for Software Engineering concepts. Please choose a technical topic.
        </ah-alert>
      </div>
    `,
  }),
};
