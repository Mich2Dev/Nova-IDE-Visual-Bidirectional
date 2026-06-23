/** Wraps craft-compiled React JSX into a runnable iframe srcdoc */
export function buildDraftPreviewHtml(virtualCode: string): string {
  const stripped = virtualCode
    .replace(/^import\s+.*$/gm, '')
    .replace(/export\s+default\s+function\s+GeneratedComponent/, 'function GeneratedComponent')
    .trim();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>body{margin:0;padding:0;}</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect } = React;
    ${stripped}
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(GeneratedComponent));
  </script>
</body>
</html>`;
}
