import pymysql
import time
from duckduckgo_search import DDGS

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='heitor0606',
    database='adega_express'
)
cursor = conn.cursor()

# Get all products
cursor.execute('SELECT id, name, brand FROM products')
products = cursor.fetchall()

print(f"Encontrados {len(products)} produtos. Buscando imagens reais na internet...")

with DDGS() as ddgs:
    for p in products:
        p_id, name, brand = p
        # Formulate query
        query = f"{name} {brand} bebida"
        if "Essência" in name or "Zomo" in name or "Pod" in name or "Carvão" in name:
            query = f"{name} {brand} narguile"
            
        print(f"Buscando: {query}")
        try:
            # We use max_results=1
            results = list(ddgs.images(query, max_results=1))
            if results:
                image_url = results[0]['image']
                cursor.execute('UPDATE products SET image_url = %s WHERE id = %s', (image_url, p_id))
                conn.commit()
                print(f" -> OK: {image_url[:60]}...")
            else:
                print(" -> Nenhuma imagem encontrada.")
            time.sleep(1) # respect rate limit to avoid 403
        except Exception as e:
            print(f" -> Erro na busca: {e}")

conn.close()
print("Todas as imagens atualizadas com sucesso no banco de dados!")
