import pymysql
import time
import requests
from bs4 import BeautifulSoup
import urllib.parse
import json

def get_bing_image(query):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}"
    try:
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        a_tags = soup.find_all('a', class_='iusc')
        for a in a_tags:
            m = a.get('m')
            if m:
                data = json.loads(m)
                img_url = data.get('murl')
                # Check if it's a valid image URL
                if img_url and ('jpg' in img_url or 'png' in img_url or 'jpeg' in img_url) and not 'herstylecode' in img_url:
                    return img_url
    except Exception as e:
        print(f"Erro: {e}")
    return None

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

print(f"Encontrados {len(products)} produtos. Buscando imagens no Bing...")

for p in products:
    p_id, name, brand = p
    query = f"{name} {brand} produto"
    if "Essência" in name or "Zomo" in name or "Pod" in name or "Carvão" in name:
        query = f"{name} {brand} narguile"
        
    img_url = get_bing_image(query)
    if img_url:
        cursor.execute('UPDATE products SET image_url = %s WHERE id = %s', (img_url, p_id))
        conn.commit()
        print(f"OK: {name} -> {img_url[:60]}...")
    else:
        print(f"FALHOU: {name}")
    
    time.sleep(1) # delay to avoid block

conn.close()
print("Fim!")
