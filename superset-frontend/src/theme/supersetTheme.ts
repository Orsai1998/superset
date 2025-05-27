import { supersetTheme } from '@superset-ui/core';


export const lightTheme = {
  ...supersetTheme,
  colors: {
    background: '#ffffff',
    text: {
      label: '#000000',
      help: '#333333',
    },
  },
  mode: 'light',
};

export const darkTheme = {
  ...supersetTheme,
  colors: {
    ...supersetTheme,
    background: '#000000',
    text: {
      label: '#ffffff',
      help: '#cccccc',
    },
  },
  mode: 'dark',
};

