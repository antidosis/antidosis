const fs = require('fs');
const content = fs.readFileSync('src/app/(app)/terminal/_components/terminal-client.tsx', 'utf8');

// Check template literals
let inString = false;
let stringChar = '';
let inTemplate = false;
let templateCount = 0;
for (let i = 0; i < content.length; i++) {
  const ch = content[i];
  if (inString) { if (ch === '\\') { i++; continue; } if (ch === stringChar) inString = false; continue; }
  if (inTemplate) { if (ch === '\\') { i++; continue; } if (ch === '`') { inTemplate = false; templateCount++; } continue; }
  if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
  if (ch === '`') { inTemplate = true; templateCount++; continue; }
}
console.log('Template literals count:', templateCount, '(should be even)');
console.log('In template at end:', inTemplate);

// Check JSX expressions balance
let jsxExprDepth = 0;
inString = false;
stringChar = '';
for (let i = 0; i < content.length; i++) {
  const ch = content[i];
  if (inString) { if (ch === '\\') { i++; continue; } if (ch === stringChar) inString = false; continue; }
  if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
  if (ch === '{' && !inString) jsxExprDepth++;
  if (ch === '}' && !inString) jsxExprDepth--;
}
console.log('JSX expression depth:', jsxExprDepth);
