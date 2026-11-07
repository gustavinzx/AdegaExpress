const https = require('https');
const fs = require('fs');
const path = require('path');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'AdegaExpressAcademic/1.0 (academic research project)' }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function searchWikimedia(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url&format=json`;
  const text = await get(url);
  try {
    const json = JSON.parse(text);
    if (!json.query || !json.query.pages) return null;
    const pages = Object.values(json.query.pages);
    for (const page of pages) {
      if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url) {
        const u = page.imageinfo[0].url;
        if (u.endsWith('.jpg') || u.endsWith('.png') || u.endsWith('.jpeg')) {
          return u;
        }
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function run() {
  const items = [
    { key: 'refri-coca-cola-350ml.jpg', q: 'File:Coca-Cola lata.jpg' },
    { key: 'refri-guarana-antarctica-350ml.jpg', q: 'File:Lata de Guaraná Antarctica.jpg' },
    { key: 'refri-sprite-lemon-500ml.jpg', q: 'Sprite bottle OR Sprite can' },
    { key: 'refri-ginger-ale-350ml.jpg', q: 'Ginger ale bottle' },
    { key: 'agua-minalba-500ml.jpg', q: 'Mineral water bottle plastic' },
    { key: 'agua-sao-lourenco-500ml.jpg', q: 'Sparkling mineral water glass bottle' },
    { key: 'agua-prata-1500ml.jpg', q: 'Water bottle 1.5l' },
    { key: 'agua-tonica-antarctica-350ml.jpg', q: 'Tonic water can OR bottle' },
    { key: 'suco-aurora-uva-1000ml.jpg', q: 'Grape juice bottle glass' },
    { key: 'suco-natural-one-laranja-900ml.jpg', q: 'Orange juice bottle' },
    { key: 'suco-campo-largo-maca-1000ml.jpg', q: 'Apple juice glass bottle' },
    { key: 'nectar-maguary-maracuja-1000ml.jpg', q: 'Passion fruit juice bottle' },
    { key: 'cha-matte-leao-1500ml.jpg', q: 'Mate drink bottle OR iced tea bottle' },
    { key: 'cha-fuze-pessego-450ml.jpg', q: 'Peach iced tea bottle' },
    { key: 'cha-feel-good-verde-1000ml.jpg', q: 'Green tea bottle' },
    { key: 'cha-wewi-hibisco-450ml.jpg', q: 'Hibiscus tea drink bottle' }
  ];

  for (const item of items) {
    const url = await searchWikimedia(item.q);
    console.log(item.key, '->', url);
  }
}

run().catch(console.error);
