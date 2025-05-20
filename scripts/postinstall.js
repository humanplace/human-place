import fs from 'fs';
import path from 'path';

const file = path.join('node_modules', '@typescript-eslint', 'eslint-plugin', 'dist', 'rules', 'no-unused-expressions.js');
if (fs.existsSync(file)) {
  let src = fs.readFileSync(file, 'utf8');
  const target = 'const rules = baseRule.create(context);';
  const replacement = `const rules = baseRule.create({\n            ...context,\n            options: [{\n                allowShortCircuit,\n                allowTernary,\n                allowTaggedTemplates: false,\n                enforceForJSX: false,\n                ignoreDirectives: false,\n            }],\n        });`;
  if (src.includes(target) && !src.includes('ignoreDirectives')) {
    src = src.replace(target, replacement);
    fs.writeFileSync(file, src);
  }
}
