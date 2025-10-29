# generateGamesData.py
# Usage: python generateGamesData.py
# This script parses games.html and outputs gamesData.js with all games.

import os
import re
import json
from bs4 import BeautifulSoup

html_path = os.path.join(os.path.dirname(__file__), 'games.html')
output_path = os.path.join(os.path.dirname(__file__), 'gamesData.js')

with open(html_path, encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'html.parser')

games = []

for a in soup.select('.game-grid a.game-button'):
    href = a.get('href', '')
    if not href or href.startswith('http'):
        continue
    img = a.find('img')['src'] if a.find('img') else ''
    name = a.find('p').text.strip() if a.find('p') else ''
    iframe = ''
    identifier = ''
    m = re.search(r'game\.html\?game=([^&]+)', href)
    if m:
        iframe = m.group(1)
        # Extract identifier: folder before index.html
        id_match = re.search(r'/([^/]+)/index\.html$', iframe)
        if id_match:
            identifier = id_match.group(1)
        else:
            # fallback: last folder in path
            parts = iframe.strip('/').split('/')
            if len(parts) > 1:
                identifier = parts[-2]
            else:
                identifier = parts[0]
    games.append({
        'name': name,
        'gamePage': href,
        'iframe': iframe,
        'img': img,
        'identifier': identifier
    })

js = f"// gamesData.js - generated from games.html\nconst games = {json.dumps(games, indent=4)};\n"
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(js)
print(f'gamesData.js generated with {len(games)} games.')
