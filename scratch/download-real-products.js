const https = require('https');
const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.resolve('c:/Users/gsds0/Desktop/Adega Express/adega-express-frontend/public/products');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

const productsToDownload = [
  // 1. Água Mineral Sem Gás 500ml (Minalba)
  {
    filename: 'agua-minalba-500ml.jpg',
    url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80'
  },
  // 2. Água Mineral Com Gás 500ml (São Lourenço)
  {
    filename: 'agua-sao-lourenco-500ml.jpg',
    url: 'https://images.unsplash.com/photo-1559839914-1b346d610360?auto=format&fit=crop&w=600&q=80'
  },
  // 3. Água Mineral Premium Sem Gás 1,5L (Prata)
  {
    filename: 'agua-prata-1500ml.jpg',
    url: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80'
  },
  // 4. Água Tônica Citrus Sem Açúcar 350ml (Antarctica)
  {
    filename: 'agua-tonica-antarctica-350ml.jpg',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'
  },
  // 5. Suco Integral de Uva Tinto 1L (Aurora)
  {
    filename: 'suco-aurora-uva-1000ml.jpg',
    url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=80'
  },
  // 6. Suco de Laranja Integral 900ml (Natural One)
  {
    filename: 'suco-natural-one-laranja-900ml.jpg',
    url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80'
  },
  // 7. Suco de Maçã Integral 1L (Campo Largo)
  {
    filename: 'suco-campo-largo-maca-1000ml.jpg',
    url: 'https://images.unsplash.com/photo-1576181256399-835fb3751760?auto=format&fit=crop&w=600&q=80'
  },
  // 8. Néctar de Maracujá 1L (Maguary)
  {
    filename: 'nectar-maguary-maracuja-1000ml.jpg',
    url: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80'
  },
  // 9. Refrigerante Guaraná Antarctica 350ml (Antarctica)
  {
    filename: 'refri-guarana-antarctica-350ml.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Lata_de_Guaran%C3%A1_Antarctica.jpg'
  },
  // 10. Coca-Cola Original 350ml Lata (Coca-Cola)
  {
    filename: 'refri-coca-cola-350ml.jpg',
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80'
  },
  // 11. Refrigerante Sprite Lemon Fresh 500ml (Sprite)
  {
    filename: 'refri-sprite-lemon-500ml.jpg',
    url: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=600&q=80'
  },
  // 12. Refrigerante de Gengibre Ginger Ale 350ml (London Essence)
  {
    filename: 'refri-ginger-ale-350ml.jpg',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'
  },
  // 13. Chá Gelado Matte Limão 1,5L (Matte Leão)
  {
    filename: 'cha-matte-leao-1500ml.jpg',
    url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80'
  },
  // 14. Chá Gelado de Pêssego 450ml (Fuze Tea)
  {
    filename: 'cha-fuze-pessego-450ml.jpg',
    url: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=600&q=80'
  },
  // 15. Chá Verde com Limão e Hortelã 1L (Feel Good)
  {
    filename: 'cha-feel-good-verde-1000ml.jpg',
    url: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=600&q=80'
  },
  // 16. Infusão Hibisco com Cranberry 450ml (Wewi)
  {
    filename: 'cha-wewi-hibisco-450ml.jpg',
    url: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=600&q=80'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
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
  console.log('Iniciando download das imagens reais dos 16 produtos...');
  for (const item of productsToDownload) {
    const dest = path.join(TARGET_DIR, item.filename);
    try {
      await downloadFile(item.url, dest);
      const stat = fs.statSync(dest);
      console.log(`✅ ${item.filename} salvo (${(stat.size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(`❌ Erro ao baixar ${item.filename}:`, e.message);
    }
  }
}

main().catch(console.error);
