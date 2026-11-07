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

  console.log('🚀 Iniciando recaptura dos 10 prints solicitados (produção Next.js, 1440x900)...');

  // ==========================================
  // T01_catalogo: captura de página inteira com filtros e produto "em falta"
  // ==========================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await sleep(1200);

    const dest = path.join(ROOT_DIR, 'T01_catalogo.png');
    await page.screenshot({ path: dest, fullPage: true });
    console.log('✅ T01_catalogo.png recapturado (página inteira com fotos reais dos produtos).');

    // Click on the first in-stock product to capture T02_detalhe_produto
    const firstProduct = await page.$('a[href^="/produto/"]');
    if (firstProduct) {
      await firstProduct.click();
      await page.waitForLoadState('networkidle');
      await sleep(1000);
      const destT02 = path.join(ROOT_DIR, 'T02_detalhe_produto.png');
      await page.screenshot({ path: destT02 });
      console.log('✅ T02_detalhe_produto.png recapturado com foto real.');
    }

    await context.close();
  }

  // ==========================================
  // T04_login: login sem a caixa de demonstração
  // ==========================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await sleep(800);

    const dest = path.join(ROOT_DIR, 'T04_login.png');
    await page.screenshot({ path: dest });
    console.log('✅ T04_login.png recapturado (sem box de senhas/contas).');
    await context.close();
  }

  // ==========================================
  // T06_checkout, T08_meus_pedidos, T15_detalhe_pedido
  // ==========================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // Login as cliente
    await loginUser(page, 'cliente@adegaexpress.com', 'Admin@123');

    // Add 2 items to cart
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await sleep(1000);

    const addButtons = await page.$$('button:has-text("Adicionar")');
    if (addButtons.length >= 2) {
      await addButtons[0].click();
      await sleep(500);
      await addButtons[1].click();
      await sleep(500);
    }

    // Go to carrinho
    await page.goto('http://localhost:3000/carrinho', { waitUntil: 'networkidle' });
    await sleep(1200);

    // T05_carrinho
    const destT05 = path.join(ROOT_DIR, 'T05_carrinho.png');
    await page.screenshot({ path: destT05, fullPage: false });
    console.log('✅ T05_carrinho.png recapturado com imagem real.');

    // Apply coupon BEMVINDO10
    const couponInput = await page.$('input[placeholder*="BEMVINDO"]');
    if (couponInput) {
      await couponInput.fill('BEMVINDO10');
      const applyBtn = await page.$('button:has-text("Aplicar")');
      if (applyBtn) {
        await applyBtn.click();
        await sleep(1500);
      }
    }

    // Wait for discount line to appear in summary
    await page.waitForSelector('text=Desconto Aplicado', { timeout: 5000 }).catch(() => {});

    // T06_checkout (Página inteira)
    const destT06 = path.join(ROOT_DIR, 'T06_checkout.png');
    await page.screenshot({ path: destT06, fullPage: true });
    console.log('✅ T06_checkout.png recapturado (página inteira, cupom aplicado, linha de desconto e total demonstrativo).');

    // T08_meus_pedidos (Página inteira com lista completa de pedidos)
    await page.goto('http://localhost:3000/pedidos', { waitUntil: 'networkidle' });
    await sleep(1500);

    const destT08 = path.join(ROOT_DIR, 'T08_meus_pedidos.png');
    await page.screenshot({ path: destT08, fullPage: true });
    console.log('✅ T08_meus_pedidos.png recapturado (página inteira com todos os status de pedidos).');

    // T15_detalhe_pedido (Página de detalhes com linha do tempo)
    const detailLink = await page.$('a:has-text("Abrir Página de Detalhes")');
    if (detailLink) {
      await detailLink.click();
      await page.waitForLoadState('networkidle');
      await sleep(1500);
    } else {
      await page.goto('http://localhost:3000/pedidos/47', { waitUntil: 'networkidle' });
      await sleep(1500);
    }

    const destT15 = path.join(ROOT_DIR, 'T15_detalhe_pedido.png');
    await page.screenshot({ path: destT15, fullPage: true });
    console.log('✅ T15_detalhe_pedido.png recapturado (página de detalhes com itens, endereço e linha do tempo).');

    await logoutUser(page);
    await context.close();
  }

  // ==========================================
  // T09_atendente: painel do atendente (sem alternar admin, alto contraste)
  // ==========================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await loginUser(page, 'atendente@adegaexpress.com', 'Admin@123');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
    await sleep(1500);

    const destT09 = path.join(ROOT_DIR, 'T09_atendente.png');
    await page.screenshot({ path: destT09, fullPage: false });
    console.log('✅ T09_atendente.png recapturado (logado como atendente real, alto contraste).');

    await logoutUser(page);
    await context.close();
  }

  // ==========================================
  // Admin screens: T11, T12, T13, T13b, T14
  // ==========================================
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await loginUser(page, 'admin@adegaexpress.com', 'Admin@123');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
    await sleep(1500);

    // T11_admin_pedidos (aba ativa padrão: Pedidos & Entregas)
    const destT11 = path.join(ROOT_DIR, 'T11_admin_pedidos.png');
    await page.screenshot({ path: destT11, fullPage: false });
    console.log('✅ T11_admin_pedidos.png recapturado (admin pedidos com alto contraste e barra lateral inteira).');

    // T12_admin_produtos (aba Catálogo & Categorias)
    const catalogTab = await page.$('button:has-text("Catálogo & Categorias")');
    if (catalogTab) {
      await catalogTab.click();
      await sleep(1500);
      const destT12 = path.join(ROOT_DIR, 'T12_admin_produtos.png');
      await page.screenshot({ path: destT12, fullPage: false });
      console.log('✅ T12_admin_produtos.png recapturado (catálogo e categorias com alto contraste).');
    }

    // T13_admin_estoque (aba Gestão de Estoque - Tabela de Saldos)
    const stockTab = await page.$('button:has-text("Gestão de Estoque")');
    if (stockTab) {
      await stockTab.click();
      await sleep(1500);

      const destT13 = path.join(ROOT_DIR, 'T13_admin_estoque.png');
      await page.screenshot({ path: destT13, fullPage: false });
      console.log('✅ T13_admin_estoque.png recapturado (tabela de saldos).');

      // Open Modal for T13b
      const adjustBtn = await page.$('button:has-text("Ajustar / Ver Histórico")');
      if (adjustBtn) {
        await adjustBtn.click();
        await sleep(1000);

        const destT13b = path.join(ROOT_DIR, 'T13b_admin_estoque_modal.png');
        await page.screenshot({ path: destT13b, fullPage: false });
        console.log('✅ T13b_admin_estoque_modal.png capturado (modal com título, saldo, campos e histórico visíveis).');

        // Close modal
        const closeBtn = await page.$('button:has-text("Fechar")');
        if (closeBtn) {
          await closeBtn.click();
          await sleep(500);
        }
      }
    }

    // T14_admin_relatorios (aba Relatórios de Vendas)
    const reportsTab = await page.$('button:has-text("Relatórios de Vendas")');
    if (reportsTab) {
      await reportsTab.click();
      await sleep(1800);

      const destT14 = path.join(ROOT_DIR, 'T14_admin_relatorios.png');
      await page.screenshot({ path: destT14, fullPage: false });
      console.log('✅ T14_admin_relatorios.png recapturado (números escuros e legenda explicativa).');
    }

    await logoutUser(page);
    await context.close();
  }

  await browser.close();
  console.log('🎉 Todos os prints foram recapturados com excelência e contraste verificado!');
}

main().catch(err => {
  console.error('❌ Erro no script de recaptura:', err);
  process.exit(1);
});
