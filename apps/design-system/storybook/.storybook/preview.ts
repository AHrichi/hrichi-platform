import type { Preview } from '@storybook/angular-vite';
import '@fontsource-variable/inter/index.css';
// The global stylesheets every app lists in its build options.
// eslint-disable-next-line @nx/enforce-module-boundaries -- CSS, not library code
import '../../../../libs/design-system/tokens/src/generated/tokens.css';
// eslint-disable-next-line @nx/enforce-module-boundaries -- CSS, not library code
import '../../../../libs/design-system/ui/src/styles/index.scss';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    // Accessibility violations fail the story, in the UI and in CI.
    a11y: { test: 'error' },
    controls: { expanded: true },
  },
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (story, context) => {
      // The tokens switch on data-theme, exactly as in the apps.
      document.documentElement.dataset['theme'] = context.globals['theme'];
      return story();
    },
  ],
};

export default preview;
