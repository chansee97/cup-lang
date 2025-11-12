const fs = require('fs');
const path = require('path');
const { execute } = require('./src/interpreter');

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('用法: node run.js <script.lang>');
    process.exit(1);
  }
  const full = path.resolve(process.cwd(), file);
  try {
    const src = fs.readFileSync(full, 'utf8');
    execute(src);
  } catch (e) {
    console.error(String(e && e.message ? e.message : e));
    process.exit(1);
  }
}

if (require.main === module) main();

