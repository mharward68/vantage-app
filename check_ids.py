import re
app = open('app.js','r').read()
html = open('index.html','r').read()
ids = re.findall(r'getElementById\([\'\"](.*?)[\'\"]\)', app[app.find('function setupEventListeners()'):app.find('function openSettingsModal()')])
missing = [i for i in ids if f'id="{i}"' not in html]
print('Missing IDs:', set(missing))
