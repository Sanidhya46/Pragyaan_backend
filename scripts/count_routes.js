import fs from 'fs';

const content = fs.readFileSync('src/routes/admin.routes.js', 'utf8');
const regex = /router\.(get|post|patch|put|delete)\s*\(\s*['"]([^'"]+)['"]/g;
let match;
const routes = [];
const methodCount = {};
const sections = [];

// Extract section headers
const sectionRegex = /\/\* ═+\s*(\d+\.\s*[^\n]+)\s*═+\s*\*\//g;
let secMatch;
while ((secMatch = sectionRegex.exec(content)) !== null) {
  sections.push(secMatch[1].trim());
}

while ((match = regex.exec(content)) !== null) {
  const method = match[1].toUpperCase();
  const path = match[2];
  routes.push({ method, path });
  methodCount[method] = (methodCount[method] || 0) + 1;
}

console.log('Sections found:', sections.length);
sections.forEach(s => console.log('  -', s));
console.log('\nTotal route definitions:', routes.length);
console.log('By Method:', methodCount);

const unique = new Set(routes.map(r => `${r.method} ${r.path}`));
console.log('Unique routes:', unique.size);
