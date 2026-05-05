import json
import urllib.request
import urllib.parse

def translate(text):
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&q=" + urllib.parse.quote(text)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        data = json.loads(response.read().decode('utf-8'))
        return data[0][0][0]
    except Exception as e:
        print(f"Error translating '{text}': {e}")
        return text

with open('extracted.json', 'r') as f:
    strings = json.load(f)

translations = {}
for s in strings:
    translations[s] = translate(s)

with open('translations.json', 'w') as f:
    json.dump(translations, f, indent=2, ensure_ascii=False)
print("Translations generated.")
