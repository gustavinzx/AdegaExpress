const axios = require('axios');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getGoogleImage(query) {
  try {
    const res = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(res.data);
    // Find image URLs in the raw HTML
    // Google images usually have data in scripts, but simple img tags with src might be available
    const imgs = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.startsWith('http')) {
        imgs.push(src);
      }
    });
    
    if (imgs.length > 1) {
      return imgs[1]; // 0 is usually the google logo
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function main() {
  const products = await prisma.product.findMany();
  console.log(`Buscando imagens para ${products.length} produtos...`);
  
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const q = `${p.name} ${p.brand} garrafa produto`;
    
    const imgUrl = await getGoogleImage(q);
    if (imgUrl) {
      await prisma.product.update({
        where: { id: p.id },
        data: { image_url: imgUrl }
      });
      console.log(`[${i+1}/${products.length}] ${p.name} -> OK`);
    } else {
      console.log(`[${i+1}/${products.length}] ${p.name} -> FALHOU`);
    }
    await delay(500); // 0.5s
  }
  
  console.log("Fim!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
