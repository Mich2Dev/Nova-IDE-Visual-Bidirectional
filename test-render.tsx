import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './src/App';

try {
  renderToString(React.createElement(App));
  console.log('SUCCESS');
} catch(e) {
  console.error('REACT CRASH:', e);
}
