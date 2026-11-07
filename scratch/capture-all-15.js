const { chromium } = require('c:/Users/gsds0/Desktop/Adega Express/adega-express-backend/node_modules/playwright');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginUser(page, email, password) {
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await sleep(1500);
}

async function logoutUser(page) {
  try {
    const logoutBtn = await page.$('button:has-text("Sair")');
    if (logoutBtn) {
      await logoutBtn.click();
      await sleep(1000);
    }
  } catch (e) {
    // ignore
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });

  console.log('🚀 Iniciando captura automatizada dos 15 prints oficiais...');

  // ==========================================
  // T01_catalogo: filtros e produto "em falta"
  // ==========================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await sleep(1000);

    // Scroll to products area where "Em Falta" badge is visible
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Em Falta'));
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await sleep(500);

    const dest = path.join(ROOT_DIR, 'T01_catalogo.png');
    await page.screenshot({ path: dest });
    console.log('✅ T01_catalogo.png capturado.');
    await context.close();
  }

  // ==========================================
  // T02_detalhe_produto: preço, estoque e botão
  // ==========================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    // Use an active product with stock, e.g. Água Mineral Sem Gás 500ml
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    // Click on the first in-stock product
    const productCard = await page.$('a[href^="/produto/"]');
    if (productCard) {
      await productCard.click();
      await page.waitForLoadState('networkidle');
      await sleep(1000);
    } else {
      await page.goto('http://localhost:3000/produto/128', { waitUntil: 'networkidle' });
      await sleep(1000);
    }

    const dest = path.join(ROOT_DIR, 'T02_detalhe_produto.png');
    await page.screenshot({ path: dest });
    console.log('✅ T02_detalhe_produto.png capturado.');
    await context.close();
  }

  // ==========================================
  // T03_cadastro: formulário preenchido (sem concluir)
  // ==========================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/cadastro', { waitUntil: 'networkidle' });
    await sleep(800);

    const inputs = await page.$$('form input');
    if (inputs.length >= 3) {
      await inputs[0].fill('Mariana Santos Silva');
      await inputs[1].fill('mariana.silva@exemplo.com.br');
      await inputs[2].fill('SenhaFicticia@2026');
    }
    await sleep(500);

    const dest = path.join(ROOT_DIR, 'T03_cadastro.png');
    await page.screenshot({ path: dest });
    console.log('✅ T03_cadastro.png capturado.');
    await context.close();
  }

  // ==========================================
  // T04_login: tela de login
  // ==========================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await sleep(800);

    const dest = path.join(ROOT_DIR, 'T04_login.png');
    await page.screenshot({ path: dest });
    console.log('✅ T04_login.png capturado.');
    await context.close();
  }

  // ==========================================
  // T05_carrinho, T06_checkout, T07_enderecos, T08_meus_pedidos, T15_detalhe_pedido
  // ==========================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // Login as cliente first
    await loginUser(page, 'cliente@adegaexpress.com', 'Admin@123');

    // Add 2 items to cart
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await sleep(1000);

    // Find in-stock products
    const addButtons = await page.$$('button:has-text("Adicionar")');
    if (addButtons.length >= 2) {
      await addButtons[0].click();
      await sleep(400);
      await addButtons[1].click();
      await sleep(400);
    }

    // Go to carrinho
    await page.goto('http://localhost:3000/carrinho', { waitUntil: 'networkidle' });
    await sleep(1000);

    // T05_carrinho (focus on cart list & subtotal)
    const destT05 = path.join(ROOT_DIR, 'T05_carrinho.png');
    await page.screenshot({ path: destT05 });
    console.log('✅ T05_carrinho.png capturado.');

    // Apply coupon BEMVINDO10
    const couponInput = await page.$('input[placeholder*="BEMVINDO"]');
    if (couponInput) {
      await couponInput.fill('BEMVINDO10');
      const applyCouponBtn = await page.$('button:has-text("Aplicar cupom")');
      if (applyCouponBtn) {
        await applyCouponBtn.click();
        await sleep(1200);
      }
    }

    // Scroll to see checkout: address, demonstrative notice, payment method, coupon discount, shipping fee R$ 7,90 and total
    const addrHeading = await page.$('h2:has-text("2. Endereço de Entrega")');
    if (addrHeading) {
      await addrHeading.scrollIntoViewIfNeeded();
    } else {
      await page.evaluate(() => window.scrollTo(0, 450));
    }
    await sleep(600);

    // T06_checkout
    const destT06 = path.join(ROOT_DIR, 'T06_checkout.png');
    await page.screenshot({ path: destT06 });
    console.log('✅ T06_checkout.png capturado.');

    // T07_enderecos (Aba endereços do cliente)
    await page.goto('http://localhost:3000/perfil?tab=ENDERECOS', { waitUntil: 'networkidle' });
    await sleep(1000);

    const destT07 = path.join(ROOT_DIR, 'T07_enderecos.png');
    await page.screenshot({ path: destT07 });
    console.log('✅ T07_enderecos.png capturado.');

    // T08_meus_pedidos (Lista de pedidos com vários status)
    await page.goto('http://localhost:3000/pedidos', { waitUntil: 'networkidle' });
    await sleep(1000);

    const destT08 = path.join(ROOT_DIR, 'T08_meus_pedidos.png');
    await page.screenshot({ path: destT08 });
    console.log('✅ T08_meus_pedidos.png capturado.');

    // T15_detalhe_pedido
    const firstOrderLink = await page.$('a[href^="/pedidos/"]');
    if (firstOrderLink) {
      await firstOrderLink.click();
      await page.waitForLoadState('networkidle');
      await sleep(1200);
      const destT15 = path.join(ROOT_DIR, 'T15_detalhe_pedido.png');
      await page.screenshot({ path: destT15 });
      console.log('✅ T15_detalhe_pedido.png capturado.');
    }

    await logoutUser(page);
    await context.close();
  }

  // ==========================================
  // T09_atendente: painel atendente
  // ==========================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await loginUser(page, 'atendente@adegaexpress.com', 'Admin@123');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
    await sleep(1200);

    const destT09 = path.join(ROOT_DIR, 'T09_atendente.png');
    await page.screenshot({ path: destT09 });
    console.log('✅ T09_atendente.png capturado.');

    await logoutUser(page);
    await context.close();
  }

  // ==========================================
  // T10_entregador: console do entregador
  // ==========================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await loginUser(page, 'entregador@adegaexpress.com', 'Admin@123');
    await page.goto('http://localhost:3000/entregador', { waitUntil: 'networkidle' });
    await sleep(1200);

    const destT10 = path.join(ROOT_DIR, 'T10_entregador.png');
    await page.screenshot({ path: destT10 });
    console.log('✅ T10_entregador.png capturado.');

    await logoutUser(page);
    await context.close();
  }

  // ==========================================
  // Admin screens: T11, T12, T13, T14
  // ==========================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await loginUser(page, 'admin@adegaexpress.com', 'Admin@123');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
    await sleep(1200);

    // T11_admin_pedidos (aba ativa padrão: Pedidos & Entregas)
    const destT11 = path.join(ROOT_DIR, 'T11_admin_pedidos.png');
    await page.screenshot({ path: destT11 });
    console.log('✅ T11_admin_pedidos.png capturado.');

    // T12_admin_produtos (aba Catálogo & Categorias)
    const catalogTab = await page.$('button:has-text("Catálogo & Categorias")');
    if (catalogTab) {
      await catalogTab.click();
      await sleep(1200);
      const destT12 = path.join(ROOT_DIR, 'T12_admin_produtos.png');
      await page.screenshot({ path: destT12 });
      console.log('✅ T12_admin_produtos.png capturado.');
    }

    // T13_admin_estoque (aba Gestão de Estoque + Modal aberto)
    const stockTab = await page.$('button:has-text("Gestão de Estoque")');
    if (stockTab) {
      await stockTab.click();
      await sleep(1200);
      
      const adjustBtn = await page.$('button:has-text("Ajustar / Ver Histórico")');
      if (adjustBtn) {
        await adjustBtn.click();
        await sleep(800);
      }
      
      const destT13 = path.join(ROOT_DIR, 'T13_admin_estoque.png');
      await page.screenshot({ path: destT13 });
      console.log('✅ T13_admin_estoque.png capturado.');

      // Close modal
      const closeBtn = await page.$('button:has-text("Fechar")');
      if (closeBtn) {
        await closeBtn.click();
        await sleep(400);
      }
    }

    // T14_admin_relatorios (aba Relatórios de Vendas)
    const reportsTab = await page.$('button:has-text("Relatórios de Vendas")');
    if (reportsTab) {
      await reportsTab.click();
      await sleep(1500);
      const destT14 = path.join(ROOT_DIR, 'T14_admin_relatorios.png');
      await page.screenshot({ path: destT14 });
      console.log('✅ T14_admin_relatorios.png capturado.');
    }

    await logoutUser(page);
    await context.close();
  }

  await browser.close();
  console.log('🎉 Todos os 15 prints oficiais foram capturados com sucesso!');
}

main().catch(err => {
  console.error('❌ Erro no script de captura:', err);
  process.exit(1);
});
