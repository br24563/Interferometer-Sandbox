import re
js = open('app.js', encoding='utf-8').read()
html = open('index.html', encoding='utf-8').read()
js_ids = set(re.findall(r'\$\("([^"]+)"\)', js))
html_ids = set(re.findall(r'id="([^"]+)"', html))
missing = js_ids - html_ids
print('Missing IDs:', sorted(missing) if missing else 'None')
