import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'Ahmed Hrichi · Design system',
    brandUrl: 'https://portfolio.ahmed-hrichi.workers.dev',
    brandTarget: '_self',
    colorPrimary: '#e66f85',
    colorSecondary: '#e66f85',
  }),
});
