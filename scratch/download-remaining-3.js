const https = require('https');
const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.resolve('c:/Users/gsds0/Desktop/Adega Express/adega-express-frontend/public/products');

const items = [
  {
    filename: 'agua-sao-lourenco-500ml.jpg',
    url: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=600&q=80'
  },
  {
    filename: 'suco-campo-largo-maca-1000ml.jpg',
    url: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=600&q=80'
  },
  {
    filename: 'refri-guarana-antarctica-350ml.jpg',
    url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadFile(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function main() {
  for (const item of items) {
    const dest = path.join(TARGET_DIR, item.filename);
    await downloadFile(item.url, dest);
    const stat = fs.statSync(dest);
    console.log(`✅ ${item.filename} salvo (${(stat.size / 1024).toFixed(1)} KB)`);
  }
}

main().catch(console.error);
