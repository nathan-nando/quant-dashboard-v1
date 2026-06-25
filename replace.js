const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Check if file contains the base URL
  if (!content.includes('127.0.0.1:8000/api') && !content.includes('localhost:8000/api')) {
    return;
  }

  // Replace single and double quotes
  content = content.replace(/['"]http:\/\/(?:127\.0\.0\.1|localhost):8000\/api([^'"]*)['"]/g, "\`${API_BASE_URL}$1\`");
  
  // Replace backticks
  content = content.replace(/`http:\/\/(?:127\.0\.0\.1|localhost):8000\/api([^`]*)`/g, "\`${API_BASE_URL}$1\`");

  if (content !== originalContent) {
    // Check if import already exists
    if (!content.includes("import { API_BASE_URL } from '@/config/env'")) {
      // Find the last import statement or put at the top
      const importLines = content.split('\n').filter(l => l.startsWith('import '));
      const newImport = "import { API_BASE_URL } from '@/config/env';\n";
      
      if (importLines.length > 0) {
        const lastImport = importLines[importLines.length - 1];
        content = content.replace(lastImport, lastImport + '\n' + newImport.trim());
      } else {
        content = newImport + content;
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

walkDir(path.join(__dirname, 'src'), processFile);
console.log('Done replacing URLs!');
