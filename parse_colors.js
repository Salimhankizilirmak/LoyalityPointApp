const fs = require('fs');
const html = fs.readFileSync('cashier.html', 'utf-8');
const match = html.match(/"colors":\s*(\{[\s\S]*?\})/);
if (match) {
  const colors = JSON.parse(match[1]);
  let css = '';
  for (const [key, value] of Object.entries(colors)) {
    css += `  --color-${key}: ${value};\n`;
  }
  console.log(css);
}
