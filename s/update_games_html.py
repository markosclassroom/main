import json
import re

# Read gamesData.js and extract the games array
with open('gamesData.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Extract the JSON array from the JS file
match = re.search(r'const games = (\[.*?\]);', js_content, re.DOTALL)
if not match:
    raise ValueError('Could not find games array in gamesData.js')
games_json = match.group(1)
games = json.loads(games_json)

# Build the HTML for the games grid
game_grid_html = ''
for game in games:
    identifier = game['identifier']
    img = game['img']
    name = game['name']
    game_grid_html += f'        <a href="game.html?game={identifier}" class="game-button">\n'
    game_grid_html += f'            <img src="{img}">\n'
    game_grid_html += f'            <p>{name}</p>\n'
    game_grid_html += f'        </a>\n'

# Read games.html and replace the game grid
with open('games.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the content inside <div class="game-grid">...</div>
grid_pattern = re.compile(r'(<div class="game-grid">)(.*?)(</div>)', re.DOTALL)
new_html = grid_pattern.sub(r'\1\n' + game_grid_html + r'    \3', html)

with open('games.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print('games.html updated with games from gamesData.js')
