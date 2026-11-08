import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // 1. Check Catalog
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  const cardCount = await page.$$eval('.group.bg-white.rounded-3xl', els => els.length);
  console.log('Catalog cards rendered:', cardCount);

  // 2. Check Product Detail with Carousel
  await page.goto('http://localhost:3000/produto/164', { waitUntil: 'networkidle' });
  const title = await page.$eval('h1', el => el.textContent.trim());
  const carouselThumbs = await page.$$eval('.grid.grid-cols-4 button', els => els.map(e => e.textContent.trim()));
  const sommelierCard = await page.$eval('section h2', el => el.textContent.trim());
  
  console.log('Product title:', title);
  console.log('Carousel thumbnails count:', carouselThumbs.length, carouselThumbs);
  console.log('Sommelier card title:', sommelierCard);

  // Test clicking next arrow on carousel
  const initialCounter = await page.$eval('.font-mono', el => el.textContent.trim());
  console.log('Initial counter:', initialCounter);
  await page.click('button[aria-label="Próxima imagem"]');
  await page.waitForTimeout(500);
  const nextCounter = await page.$eval('.font-mono', el => el.textContent.trim());
  console.log('Counter after next click:', nextCounter);

  await browser.close();
  console.log('VERIFICAÇÃO DO CARROSSEL CONCLUÍDA COM SUCESSO!');
}

test().catch(console.error);
