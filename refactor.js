const fs = require('fs');
const path = require('path');

const dir = '/Users/sarth/Desktop/DBMS PROJECT/frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace standard string 'http://localhost:5000/api...'
  content = content.replace(/'http:\/\/localhost:5000([^']*)'/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");

  // Replace template literals `http://localhost:5000/api...`
  content = content.replace(/`http:\/\/localhost:5000([^`]*)`/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");

  fs.writeFileSync(filePath, content);
});
console.log('Refactored frontend URLs for Vercel deployment');
