import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const imageMapping: Record<string, string> = {
  'Água Mineral Sem Gás 500ml': '/products/agua-minalba-500ml.jpg',
  'Água Mineral Com Gás 500ml': '/products/agua-sao-lourenco-500ml.jpg',
  'Água Mineral Premium Sem Gás 1,5L': '/products/agua-prata-1500ml.jpg',
  'Água Tônica Citrus Sem Açúcar 350ml': '/products/agua-tonica-antarctica-350ml.jpg',
  'Suco Integral de Uva Tinto 1L': '/products/suco-aurora-uva-1000ml.jpg',
  'Suco de Laranja Integral 900ml': '/products/suco-natural-one-laranja-900ml.jpg',
  'Suco de Maçã Integral 1L': '/products/suco-campo-largo-maca-1000ml.jpg',
  'Néctar de Maracujá 1L': '/products/nectar-maguary-maracuja-1000ml.jpg',
  'Refrigerante Guaraná Antarctica 350ml': '/products/refri-guarana-antarctica-350ml.jpg',
  'Coca-Cola Original 350ml Lata': '/products/refri-coca-cola-350ml.jpg',
  'Refrigerante Sprite Lemon Fresh 500ml': '/products/refri-sprite-lemon-500ml.jpg',
  'Refrigerante de Gengibre Ginger Ale 350ml': '/products/refri-ginger-ale-350ml.jpg',
  'Chá Gelado Matte Limão 1,5L': '/products/cha-matte-leao-1500ml.jpg',
  'Chá Gelado de Pêssego 450ml': '/products/cha-fuze-pessego-450ml.jpg',
  'Chá Verde com Limão e Hortelã 1L': '/products/cha-feel-good-verde-1000ml.jpg',
  'Infusão Hibisco com Cranberry 450ml': '/products/cha-wewi-hibisco-450ml.jpg',
};

async function main() {
  console.log('Atualizando imagens dos produtos no banco de dados...');
  for (const [name, imageUrl] of Object.entries(imageMapping)) {
    const updated = await db.product.updateMany({
      where: { name },
      data: { image_url: imageUrl },
    });
    console.log(`✅ ${name} -> ${imageUrl} (${updated.count} atualizados)`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
