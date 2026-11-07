const https = require('https');
const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.resolve('c:/Users/gsds0/Desktop/Adega Express/adega-express-frontend/public/products');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AdegaExpress-Academic/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(download(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`));
      }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function searchProduct(term) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=5`;
  const res = await fetchJson(url);
  if (!res.products || res.products.length === 0) return null;
  for (const p of res.products) {
    if (p.selected_images?.front?.display?.pt) return p.selected_images.front.display.pt;
    if (p.selected_images?.front?.display?.en) return p.selected_images.front.display.en;
    if (p.image_front_url) return p.image_front_url;
    if (p.image_url) return p.image_url;
  }
  return null;
}

const queries = [
  { file: 'agua-minalba-500ml.jpg', q: 'Minalba sem gas' },
  { file: 'agua-sao-lourenco-500ml.jpg', q: 'São Lourenço água' },
  { file: 'agua-prata-1500ml.jpg', q: 'Água Prata' },
  { file: 'agua-tonica-antarctica-350ml.jpg', q: 'Agua Tonica Antarctica' },
  { file: 'suco-aurora-uva-1000ml.jpg', q: 'Suco Aurora Uva' },
  { file: 'suco-natural-one-laranja-900ml.jpg', q: 'Natural One Laranja' },
  { file: 'suco-campo-largo-maca-1000ml.jpg', q: 'Campo Largo Maca' },
  { file: 'nectar-maguary-maracuja-1000ml.jpg', q: 'Maguary Maracuja' },
  { file: 'refri-guarana-antarctica-350ml.jpg', q: 'Guaraná Antarctica' },
  { file: 'refri-coca-cola-350ml.jpg', q: 'Coca Cola lata 350ml' },
  { file: 'refri-sprite-lemon-500ml.jpg', q: 'Sprite refrigerante' },
  { file: 'refri-ginger-ale-350ml.jpg', q: 'London Essence Ginger Ale' },
  { file: 'cha-matte-leao-1500ml.jpg', q: 'Matte Leao Limao' },
  { file: 'cha-fuze-pessego-450ml.jpg', q: 'Fuze Tea Pessego' },
  { file: 'cha-feel-good-verde-1000ml.jpg', q: 'Feel Good Cha Verde' },
  { file: 'cha-wewi-hibisco-450ml.jpg', q: 'Wewi Cha' }
];

async function main() {
  for (const item of queries) {
    try {
      const imgUrl = await searchProduct(item.q);
      console.log(item.file, '(', item.q, ') ->', imgUrl);
      if (imgUrl) {
        const dest = path.join(TARGET_DIR, item.file);
        await download(imgUrl, dest);
        const stat = fs.statSync(dest);
        console.log(`  💾 Baixado: ${(stat.size / 1024).toFixed(1)} KB`);
      }
    } catch (e) {
      console.error(`  ❌ Erro em ${item.file}:`, e.message);
    }
  }
}

main().catch(console.error);
