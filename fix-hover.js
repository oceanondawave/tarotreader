const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'styles', 'App.css');
let css = fs.readFileSync(cssPath, 'utf8');

// List of button classes to fix tap-hover on iOS
const targets = [
  '.continue-button',
  '.shuffle-button',
  '.google-signin-button',
  '.sign-out-button',
  '.view-all-cards-button',
  '.view-readings-button'
];

targets.forEach(target => {
  const hoverRegex = new RegExp(`(${target.replace(/\./g, '\\.')}:hover(?:\\:not\\(:disabled\\))?\\s*\\{[\\s\\S]*?\\})`, 'g');
  css = css.replace(hoverRegex, (match) => {
    // If it's already wrapped, don't wrap again
    if (css.substring(css.indexOf(match) - 30, css.indexOf(match)).includes('@media (hover: hover)')) {
      return match;
    }
    return `@media (hover: hover) and (pointer: fine) {\n  ${match.replace(/\n/g, '\n  ')}\n}`;
  });
});

fs.writeFileSync(cssPath, css);
console.log('Fixed hover states in App.css');
