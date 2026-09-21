const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const products = await prisma.product.findMany();
  console.log(`Buscando ${products.length} imagens com Playwright...`);
  
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    let query = `${p.brand} ${p.name} garrafa bebida`;
    if (p.name.includes('Zomo') || p.name.includes('Seda') || p.name.includes('Fumo')) {
      query = `${p.brand} ${p.name} narguile`;
    }
    
    try {
      await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`, { waitUntil: 'networkidle' });
      // Wait for images to load
      await page.waitForTimeout(1000);
      
      const imgSrc = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img.tile--img__img');
        if (imgs.length > 0) {
           return imgs[0].getAttribute('src');
        }
        return null;
      });
      
      if (imgSrc) {
        await prisma.product.update({
          where: { id: p.id },
          data: { image_url: imgSrc }
        });
        console.log(`[OK] ${p.name}`);
      } else {
        console.log(`[FALHOU] ${p.name}`);
      }
    } catch (e) {
      console.log(`[ERRO] ${p.name}: ${e.message}`);
    }
  }
  
  await browser.close();
  await prisma.$disconnect();
}

main();
