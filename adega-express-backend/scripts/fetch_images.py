import os
import json
import time
import urllib.request
import urllib.parse
import re

# ==============================================================================
# SCRIPT PARA BUSCAR IMAGENS REAIS DOS PRODUTOS
# 
# Como usar:
# 1. Certifique-se de que o backend está rodando e conectado ao banco.
# 2. Rode primeiro o script TS para exportar os produtos: 
#    npx tsx scripts/export_products.ts
# 3. Rode este script:
#    python scripts/fetch_images.py
# ==============================================================================

FRONTEND_PUBLIC = r"../adega-express-frontend/public/products"
os.makedirs(FRONTEND_PUBLIC, exist_ok=True)

print("Iniciando busca de imagens...")

try:
    with open("products_list.json", "r", encoding="utf-8") as f:
        products = json.load(f)
except FileNotFoundError:
    print("Erro: products_list.json não encontrado. Exporte os produtos primeiro.")
    exit(1)

# Um User-Agent real para evitar bloqueios simples
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
}

def search_image(query):
    """Busca a primeira imagem no Bing (geralmente mais permissivo que o Google para scraping simples)"""
    try:
        search_url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query + " garrafa branca png")
        req = urllib.request.Request(search_url, headers=HEADERS)
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        
        # O Bing armazena as URLs das imagens na tag m="{...murl...}"
        match = re.search(r'murl&quot;:&quot;(.*?)&quot;', html)
        if match:
            return match.group(1)
    except Exception as e:
        print(f"Erro na busca: {e}")
    return None

updated_products = []

for p in products:
    target_path = os.path.join(FRONTEND_PUBLIC, f"{p['id']}.jpg")
    
    # Pular se a imagem já existir ou se já for uma imagem premium salva
    if os.path.exists(target_path) or (p.get('image_url') and not p['image_url'].endswith('.jpg')):
        continue
        
    print(f"Buscando: {p['name']}...")
    img_url = search_image(p['name'])
    
    if img_url:
        try:
            req = urllib.request.Request(img_url, headers=HEADERS)
            img_data = urllib.request.urlopen(req, timeout=10).read()
            with open(target_path, "wb") as f:
                f.write(img_data)
            print("  -> Sucesso!")
            updated_products.append(p)
        except Exception as e:
            print(f"  -> Falha ao baixar: {e}")
    else:
        print("  -> Não encontrada.")
    
    # Pausa para não ser bloqueado pelo provedor de busca
    time.sleep(2)

print("\nGerando script SQL/Prisma de atualização...")

ts_script = "import { PrismaClient } from '@prisma/client';\\nconst prisma = new PrismaClient();\\nasync function main() {\\n"
for p in updated_products:
    ts_script += f"  await prisma.product.update({{ where: {{ id: {p['id']} }}, data: {{ image_url: '/products/{p['id']}.jpg' }} }});\\n"
ts_script += "}\\nmain().catch(console.error).finally(() => prisma.$disconnect());\\n"

with open("update_images.ts", "w", encoding="utf-8") as f:
    f.write(ts_script)

print("Finalizado! Rode 'npx tsx update_images.ts' para aplicar as imagens no banco de dados.")
