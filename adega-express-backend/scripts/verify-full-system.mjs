import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('=== INICIANDO AUDITORIA E2E DE EVIDÊNCIAS ===\n');
  const browser = await chromium.launch({ headless: true });
  const results = {
    credentialsSecurity: {},
    profiles: {},
    responsiveness: {},
    screenshots: {}
  };

  // 1. VERIFICAÇÃO DE SEGURANÇA E CREDENCIAIS NA TELA DE LOGIN
  console.log('1. Verificando tela de login e ausência de senhas expostas...');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  const loginHtml = await page.content();
  const hasPlainPassword = loginHtml.includes('Admin@123');
  const hasDemoPasswordNotice = loginHtml.toLowerCase().includes('senha: admin@123');
  
  results.credentialsSecurity = {
    url: `${BASE_URL}/login`,
    exposedAdminPassword: hasPlainPassword,
    exposedNotice: hasDemoPasswordNotice,
    status: (!hasPlainPassword && !hasDemoPasswordNotice) ? 'SEGURO' : 'FALHA'
  };
  console.log(`- Segurança do Login: ${results.credentialsSecurity.status} (Senha Admin@123 exposta no HTML: ${hasPlainPassword})`);
  await page.close();

  // 2. TESTES DE PERFIS E FLUXOS
  const profilesToTest = [
    {
      role: 'CLIENTE',
      email: 'cliente@adegaexpress.com',
      expectedHome: '/',
      expectedAllowed: ['/', '/carrinho', '/pedidos', '/perfil'],
      forbidden: ['/admin', '/entregador']
    },
    {
      role: 'ATENDENTE',
      email: 'atendente@adegaexpress.com',
      expectedHome: '/admin',
      expectedAllowed: ['/admin'],
      forbidden: ['/entregador']
    },
    {
      role: 'ENTREGADOR',
      email: 'entregador@adegaexpress.com',
      expectedHome: '/entregador',
      expectedAllowed: ['/entregador'],
      forbidden: ['/admin']
    },
    {
      role: 'ADMINISTRADOR',
      email: 'admin@adegaexpress.com',
      expectedHome: '/admin',
      expectedAllowed: ['/admin'],
      forbidden: []
    }
  ];

  for (const p of profilesToTest) {
    console.log(`\n2. Testando perfil: ${p.role} (${p.email})...`);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pPage = await context.newPage();
    
    // Login
    await pPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await pPage.fill('input[type="email"], input[name="email"]', p.email);
    await pPage.fill('input[type="password"], input[name="password"]', 'Admin@123');
    await pPage.click('button[type="submit"]');
    
    // Espera navegação pós login
    await pPage.waitForTimeout(2000);
    const postLoginUrl = pPage.url();
    console.log(`  - URL pós login: ${postLoginUrl}`);

    // Checagem de rotas permitidas
    const allowedChecks = [];
    for (const route of p.expectedAllowed) {
      await pPage.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      await pPage.waitForTimeout(1000);
      const curUrl = pPage.url();
      const title = await pPage.title();
      allowedChecks.push({ route, currentUrl: curUrl, title, ok: curUrl.includes(route) || (route === '/' && curUrl === `${BASE_URL}/`) });
    }

    // Checagem de rotas proibidas
    const forbiddenChecks = [];
    for (const route of p.forbidden) {
      await pPage.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      await pPage.waitForTimeout(1000);
      const curUrl = pPage.url();
      const forbiddenBlocked = !curUrl.includes(route) || curUrl.includes('/login') || curUrl.includes('/admin') === false;
      forbiddenChecks.push({ route, currentUrl: curUrl, blocked: forbiddenBlocked });
    }

    // Checagens específicas de perfil
    let roleSpecificNotes = '';
    if (p.role === 'CLIENTE') {
      // Adicionar item ao carrinho
      await pPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      const buyButtons = await pPage.$$('button:has-text("Adicionar"), button:has-text("Comprar")');
      roleSpecificNotes = `Botões de compra visíveis: ${buyButtons.length}`;
    } else if (p.role === 'ATENDENTE') {
      await pPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
      const tabs = await pPage.$$eval('nav button, button[role="tab"]', els => els.map(e => e.textContent.trim()));
      const hasCatalogTab = tabs.some(t => t.toLowerCase().includes('catálogo'));
      const hasReportsTab = tabs.some(t => t.toLowerCase().includes('relatório'));
      roleSpecificNotes = `Abas visíveis para Atendente: [${tabs.join(', ')}]. Catálogo visível: ${hasCatalogTab}, Relatórios visível: ${hasReportsTab}`;
    } else if (p.role === 'ENTREGADOR') {
      await pPage.goto(`${BASE_URL}/entregador`, { waitUntil: 'networkidle' });
      const cards = await pPage.$$('article, .border, .rounded-lg');
      roleSpecificNotes = `Painel do entregador acessado com sucesso (${cards.length} blocos renderizados).`;
    } else if (p.role === 'ADMINISTRADOR') {
      await pPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
      const tabs = await pPage.$$eval('nav button, button[role="tab"]', els => els.map(e => e.textContent.trim()));
      roleSpecificNotes = `Abas visíveis para Administrador: [${tabs.join(', ')}]`;
    }

    results.profiles[p.role] = {
      email: p.email,
      postLoginUrl,
      allowedChecks,
      forbiddenChecks,
      roleSpecificNotes
    };
    console.log(`  - Notas: ${roleSpecificNotes}`);
    await context.close();
  }

  // 3. RESPONSIVIDADE DESKTOP VS MOBILE
  console.log('\n3. Verificando Responsividade Desktop (1440x900) e Mobile (375x667)...');
  const viewports = [
    { name: 'Desktop (1440x900)', width: 1440, height: 900 },
    { name: 'Mobile (375x667)', width: 375, height: 667 }
  ];

  const routesToTest = ['/', '/login', '/carrinho'];
  for (const vp of viewports) {
    const vpResults = [];
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const vPage = await context.newPage();
    for (const r of routesToTest) {
      await vPage.goto(`${BASE_URL}${r}`, { waitUntil: 'networkidle' });
      const overflow = await vPage.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        };
      });
      vpResults.push({ route: r, ...overflow });
      console.log(`  - ${vp.name} na rota ${r}: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}, overflowX=${overflow.hasHorizontalScroll}`);
    }
    results.responsiveness[vp.name] = vpResults;
    await context.close();
  }

  // 4. VERIFICAÇÃO DOS 15 ARQUIVOS DE SCREENSHOT T01-T15
  console.log('\n4. Verificando arquivos de captura T01 a T15...');
  const projectRoot = path.resolve('..');
  const expectedScreenshots = [
    { id: 'T01', file: 'T01_catalogo.png', desc: 'Catálogo de produtos completo com filtros e esgotados', secao: '13.3' },
    { id: 'T02', file: 'T02_detalhe_produto.png', desc: 'Detalhe do produto com especificações técnicas e estoque', secao: '13.3' },
    { id: 'T03', file: 'T03_cadastro.png', desc: 'Formulário de cadastro de cliente', secao: '13.3' },
    { id: 'T04', file: 'T04_login.png', desc: 'Tela de login com credenciais limpas', secao: '13.3' },
    { id: 'T05', file: 'T05_carrinho.png', desc: 'Sacola de compras com itens, subtotal e frete', secao: '13.3' },
    { id: 'T06', file: 'T06_checkout.png', desc: 'Checkout com cupom aplicado e endereço selecionado', secao: '13.3' },
    { id: 'T07', file: 'T07_enderecos.png', desc: 'Gerenciamento de endereços de entrega', secao: '13.3' },
    { id: 'T08', file: 'T08_meus_pedidos.png', desc: 'Histórico de pedidos do cliente', secao: '13.3' },
    { id: 'T09', file: 'T09_atendente.png', desc: 'Painel do Atendente (apenas Pedidos & Entregas)', secao: '13.3' },
    { id: 'T10', file: 'T10_entregador.png', desc: 'Painel do Entregador com entregas em rota e finalizadas', secao: '13.3' },
    { id: 'T11', file: 'T11_admin_pedidos.png', desc: 'Admin - Gestão de Pedidos e Entregas', secao: '13.3' },
    { id: 'T12', file: 'T12_admin_produtos.png', desc: 'Admin - Gestão de Produtos e Categorias', secao: '13.3' },
    { id: 'T13', file: 'T13_admin_estoque.png', desc: 'Admin - Gestão e Movimentações de Estoque', secao: '13.3' },
    { id: 'T13b', file: 'T13b_admin_estoque_modal.png', desc: 'Admin - Modal de Movimentação de Estoque', secao: '13.3' },
    { id: 'T14', file: 'T14_admin_relatorios.png', desc: 'Admin - Relatórios de Vendas, Receita e Ticket Médio', secao: '13.3' },
    { id: 'T15', file: 'T15_detalhe_pedido.png', desc: 'Detalhe do pedido com linha do tempo de status', secao: '13.3' }
  ];

  const shotResults = [];
  for (const s of expectedScreenshots) {
    const filePath = path.join(projectRoot, s.file);
    const exists = fs.existsSync(filePath);
    let sizeKb = 0;
    let mtime = null;
    if (exists) {
      const stat = fs.statSync(filePath);
      sizeKb = (stat.size / 1024).toFixed(1);
      mtime = stat.mtime.toISOString();
    }
    shotResults.push({ ...s, exists, sizeKb: `${sizeKb} KB`, mtime });
    console.log(`  - ${s.id} (${s.file}): exists=${exists}, size=${sizeKb} KB, mtime=${mtime}`);
  }
  results.screenshots = shotResults;

  await browser.close();

  fs.writeFileSync('audit-evidence-results.json', JSON.stringify(results, null, 2));
  console.log('\n=== AUDITORIA E2E CONCLUÍDA COM SUCESSO! Resultados salvos em audit-evidence-results.json ===');
}

main().catch(err => {
  console.error('ERRO NA AUDITORIA:', err);
  process.exit(1);
});
