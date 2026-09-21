const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  console.log(`Gerando capas para ${products.length} produtos...`);
  
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    
    // Create a beautiful placeholder with the product name
    // Example: https://placehold.co/400x400/18181b/f59e0b?text=Heineken
    // 18181b is zinc-950, f59e0b is amber-500
    // We break the text into 2 lines if it's too long
    const words = p.name.split(' ');
    let line1 = words.slice(0, 2).join('+');
    let line2 = words.slice(2).join('+');
    
    let text = line1;
    if (line2) text += '\\n' + line2;
    
    // URL encode the text for safety
    const safeText = encodeURIComponent(text).replace(/%5Cn/g, '\\n');
    
    const imgUrl = `https://placehold.co/400x400/18181b/f59e0b?text=${safeText}`;
    
    await prisma.product.update({
      where: { id: p.id },
      data: { image_url: imgUrl }
    });
  }
  
  console.log("Todas as capas geradas com sucesso!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
