const https = require('https');

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

async function searchProduct(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=3`;
  const res = await fetchJson(url);
  if (res.products && res.products.length > 0) {
    for (const p of res.products) {
      if (p.image_front_url || p.image_url) {
        return {
          name: p.product_name,
          image: p.image_front_url || p.image_url
        };
      }
    }
  }
  return null;
}

async function main() {
  const queries = [
    'Coca Cola 350ml',
    'Guaraná Antarctica 350ml',
    'Agua Minalba 500ml',
    'Suco de Uva Aurora 1L',
    'Matte Leao Limao',
    'Natural One Laranja'
  ];
  for (const q of queries) {
    const res = await searchProduct(q);
    console.log(q, '->', res);
  }
}

main().catch(console.error);
