// src/lib/productGallery.ts
// Adega Express - Registro de Imagens e Galeria para Carrossel de Produtos

export interface GalleryImage {
  id: string;
  url: string;
  label: string;
  tag: 'embalagem' | 'servido' | 'rotulo' | 'origem';
  description: string;
}

export interface ProductSommelierInfo {
  temperaturaIdeal: string;
  copoRecomendado: string;
  perfilSensorial: string[];
  harmonizacao: string[];
  ingredientes: string;
  selo: string;
}

// Mapeamento de lifestyle por categoria/produto
const LIFESTYLE_MAP: Record<string, string> = {
  uva: '/products/suco-uva-lifestyle.jpg',
  laranja: '/products/suco-laranja-lifestyle.jpg',
  maca: '/products/suco-maca-lifestyle.jpg',
  agua: '/products/agua-mineral-lifestyle.jpg',
  tonica: '/products/tonica-citrus-lifestyle.jpg',
  refrigerante: '/products/refrigerante-lifestyle.jpg',
  cha: '/products/cha-gelado-lifestyle.jpg',
};

export function getProductGallery(product: {
  id: number;
  name: string;
  brand: string;
  volume_ml?: number;
  image_url?: string | null;
  category?: { name: string } | null;
}): GalleryImage[] {
  const lower = `${product.name} ${product.category?.name || ''}`.toLowerCase();
  const defaultFront = product.image_url || '/products/agua-minalba-500ml.jpg';

  let lifestyleImg = LIFESTYLE_MAP.agua;
  if (lower.includes('uva')) lifestyleImg = LIFESTYLE_MAP.uva;
  else if (lower.includes('laranja')) lifestyleImg = LIFESTYLE_MAP.laranja;
  else if (lower.includes('maçã') || lower.includes('maca')) lifestyleImg = LIFESTYLE_MAP.maca || LIFESTYLE_MAP.uva;
  else if (lower.includes('tônica') || lower.includes('tonica')) lifestyleImg = LIFESTYLE_MAP.tonica || LIFESTYLE_MAP.agua;
  else if (lower.includes('chá') || lower.includes('cha') || lower.includes('matte') || lower.includes('hibisco')) lifestyleImg = LIFESTYLE_MAP.cha;
  else if (lower.includes('guaraná') || lower.includes('coca') || lower.includes('sprite') || lower.includes('ginger') || lower.includes('refrigerante')) lifestyleImg = LIFESTYLE_MAP.refrigerante;

  return [
    {
      id: 'img-frontal',
      url: defaultFront,
      label: 'Embalagem Oficial',
      tag: 'embalagem',
      description: `Frasco oficial ${product.brand} com selo de inviolabilidade`,
    },
    {
      id: 'img-servido',
      url: lifestyleImg,
      label: 'Servido no Copo',
      tag: 'servido',
      description: 'Apresentação em copo de cristal lapidado com cubos de gelo',
    },
    {
      id: 'img-rotulo',
      url: defaultFront,
      label: 'Selo 0,0% Álcool',
      tag: 'rotulo',
      description: 'Lacre e certificação de bebida 100% livre de teor alcoólico',
    },
    {
      id: 'img-origem',
      url: lifestyleImg,
      label: 'Origem & Pureza',
      tag: 'origem',
      description: 'Ingredientes puros selecionados, sem aditivos químicos nocivos',
    },
  ];
}

export function getProductSommelierNotes(product: {
  name: string;
  brand: string;
  category?: { name: string } | null;
}): ProductSommelierInfo {
  const lower = `${product.name} ${product.category?.name || ''}`.toLowerCase();

  if (lower.includes('uva')) {
    return {
      temperaturaIdeal: '10°C a 12°C',
      copoRecomendado: 'Taça Borgonha de Cristal',
      perfilSensorial: ['Uva Isabel e Bordô', 'Acidez Equilibrada', 'Cor Púrpura Intensa', 'Corpo Aveludado'],
      harmonizacao: ['Massas artesanais', 'Risotos', 'Queijos suaves', 'Jantares em família'],
      ingredientes: '100% uva integral prensada a frio, sem adição de açúcar, conservantes ou água.',
      selo: '100% Suco Integral • Sem Glúten • 0,0% Álcool',
    };
  }

  if (lower.includes('laranja')) {
    return {
      temperaturaIdeal: '4°C a 6°C',
      copoRecomendado: 'Copo Highball com Gelo',
      perfilSensorial: ['Cítrico Vibrante', 'Rico em Vitamina C', 'Polpa Suave', 'Doçura Natural da Fruta'],
      harmonizacao: ['Café da manhã', 'Brunch', 'Grelhados leves', 'Pós-treino revigorante'],
      ingredientes: 'Suco de laranja natural integral pasteurizado e mantido sob refrigeração.',
      selo: 'Prensagem a Frio • Sem Açúcar Adicionado • 0,0% Álcool',
    };
  }

  if (lower.includes('chá') || lower.includes('cha') || lower.includes('matte') || lower.includes('hibisco')) {
    return {
      temperaturaIdeal: '3°C a 5°C',
      copoRecomendado: 'Copo Collins com Fatias de Limão',
      perfilSensorial: ['Ervas Botânicas', 'Taninos Suaves', 'Toque Floral Refrescante', 'Final Limpo'],
      harmonizacao: ['Saladas frescas', 'Peixes e frutos do mar', 'Tardes ensolaradas'],
      ingredientes: 'Extrato aquoso de folhas selecionadas, água mineral e aromas naturais.',
      selo: 'Antioxidantes Naturais • Baixo Sódio • 0,0% Álcool',
    };
  }

  if (lower.includes('refrigerante') || lower.includes('guaraná') || lower.includes('coca') || lower.includes('sprite')) {
    return {
      temperaturaIdeal: '2°C a 4°C',
      copoRecomendado: 'Copo Tulipa com Gelo e Rodela de Limão',
      perfilSensorial: ['Gás Efervescente', 'Notas Aromáticas Clássicas', 'Refrescância Instantânea'],
      harmonizacao: ['Hambúrgueres artesanais', 'Pizzas', 'Petiscos e encontros descontraídos'],
      ingredientes: 'Água gaseificada, extrato vegetal natural e ingredientes selecionados.',
      selo: 'Clássico Refrescante • Pronta Entrega • 0,0% Álcool',
    };
  }

  // Default Água Mineral
  return {
    temperaturaIdeal: '6°C a 8°C',
    copoRecomendado: 'Copo de Água Clássico ou Taça Lisa',
    perfilSensorial: ['Pureza Cristalina', 'Leveza Mineral', 'pH Equilibrado', 'Sensação Neutra e Limpa'],
    harmonizacao: ['Acompanhamento de cafés gourmet', 'Degustações', 'Hidratação contínua ao longo do dia'],
    ingredientes: 'Água mineral natural envasada na fonte.',
    selo: 'Fonte Mineral Protegida • 0 Sódio • 0,0% Álcool',
  };
}
