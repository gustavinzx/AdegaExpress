import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  
  const images = await page.$$eval('.group.bg-white.rounded-3xl img', imgs => imgs.map(i => ({
    src: i.src,
    naturalWidth: i.naturalWidth,
    naturalHeight: i.naturalHeight,
    complete: i.complete
  })));
  
  console.log('Total catalog card images rendered:', images.length);
  const loadedCount = images.filter(i => i.naturalWidth > 0).length;
  console.log('Images loaded with naturalWidth > 0:', loadedCount);
  
  for (const img of images.slice(0, 8)) {
    console.log('  -', img.src, 'size:', img.naturalWidth + 'x' + img.naturalHeight);
  }

  // Also test detail page of product 164 (Uva), 160 (Minalba), 168 (Guarana)
  for (const id of [164, 160, 168]) {
    await page.goto(`http://localhost:3000/produto/${id}`, { waitUntil: 'networkidle' });
    const detailImg = await page.$eval('.drop-shadow-md', el => ({
      src: el.src,
      width: el.naturalWidth,
      height: el.naturalHeight
    }));
    console.log(`Detail page /produto/${id}:`, detailImg);
  }

  await browser.close();
  console.log('TESTE CONCLUÍDO COM SUCESSO!');
}

main().catch(console.error);
