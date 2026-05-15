const fs = require('fs');
const content = fs.readFileSync('src/app/(app)/terminal/_components/terminal-client.tsx', 'utf8');
let depth = 0;
let inString = false;
let stringChar = '';
let inTemplate = false;
let inComment = false;
let lineNum = 1;
for (let i = 0; i < content.length; i++) {
  const ch = content[i];
  if (ch === '\n') lineNum++;
  if (inComment) { if (ch === '\n') inComment = false; continue; }
  if (!inString && !inTemplate && ch === '/' && content[i+1] === '/') { inComment = true; continue; }
  if (!inString && !inTemplate && ch === '/' && content[i+1] === '*') { i += 2; while (i < content.length && !(content[i-1] === '*' && content[i] === '/')) i++; continue; }
  if (inString) { if (ch === '\\') { i++; continue; } if (ch === stringChar) inString = false; continue; }
  if (inTemplate) { if (ch === '\\') { i++; continue; } if (ch === '`') inTemplate = false; continue; }
  if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
  if (ch === '`') { inTemplate = true; continue; }
  if (ch === '{') depth++;
  if (ch === '}') depth--;
  if (depth < 0) { console.log('UNMATCHED } at line ' + lineNum); break; }
}
console.log('Final brace depth: ' + depth);
