import requests
from bs4 import BeautifulSoup
import urllib.parse

def get_bing_image(query):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}"
    try:
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Bing images usually have class "mimg" or we can look for "m.media-amazon.com" or similar in src
        # Let's find the first a tag with class "iusc" (image result)
        a_tags = soup.find_all('a', class_='iusc')
        if a_tags:
            import json
            for a in a_tags:
                m = a.get('m')
                if m:
                    data = json.loads(m)
                    img_url = data.get('murl')
                    if img_url:
                        return img_url
                        
        # Fallback to img tags
        img_tags = soup.find_all('img')
        for img in img_tags:
            src = img.get('src')
            if src and src.startswith('http') and 'OIP' in src:
                return src
    except Exception as e:
        print(f"Erro: {e}")
    return None

print(get_bing_image("Heineken 330ml garrafa"))
