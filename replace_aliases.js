const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    if (file === 'node_modules' || file === '.expo' || file.startsWith('.')) return;
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(rootDir);
let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Match import and export statements (e.g. import {x} from '../y' or export * from '../../z')
  const importRegex = /(from|import)\s+['"]([^'"]+)['"]/g;
  
  content = content.replace(importRegex, (match, p1, importPath) => {
    if (importPath.startsWith('../') || importPath.startsWith('./')) {
      const absoluteImportPath = path.resolve(path.dirname(file), importPath);
      
      if (absoluteImportPath.startsWith(rootDir)) {
        const relativeToRoot = path.relative(rootDir, absoluteImportPath).replace(/\\/g, '/');
        const topLevelFolders = ['components', 'screens', 'context', 'hooks', 'services', 'types', 'constants', 'utils'];
        const targetFolder = relativeToRoot.split('/')[0];
        
        // Jika import path mundur ke direktori atas dan menunjuk ke folder utama yang dialiaskan
        if (importPath.includes('../') && topLevelFolders.includes(targetFolder)) {
           modified = true;
           return `${p1} '@/${relativeToRoot}'`;
        }
      }
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log(`Updated: ${path.relative(rootDir, file)}`);
  }
});

console.log(`\nSelesai! Berhasil memperbarui path import di ${updatedCount} berkas.`);
