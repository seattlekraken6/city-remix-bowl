#!/bin/bash
# Builds index.html from the files in src/. Run: bash build.sh
cd "$(dirname "$0")"
python3 - <<'PY'
page=open('src/page.html').read()
i=page.index('</style>')+len('</style>')
head,body=page[:i],page[i:]
js=''.join(open('src/'+f).read()+'\n' for f in ['data.js','core.js','render.js','play.js','ui.js'])
base='<style>html{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>'
open('index.html','w').write('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="description" content="City Gridiron: a 3D low-poly football game you play in the browser.">\n'+base+'\n'+head+'\n</head>\n<body>'+body+'\n<script>\n'+js+'</script>\n</body>\n</html>\n')
PY
wc -c index.html
