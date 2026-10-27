import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFile(path.join(root,'dist',f),'utf8');
let html=await read('index.html');
let css=await read('styles.css');
css=css.replace(/@import[^;]+;/g,'').replace(/@font-face\s*\{[^}]+\}/g,'');
const js=(await read('data.js'))+'\n'+(await read('app.js'));
const icon=await read('icon.svg');
html=html.replace('<link rel="stylesheet" href="styles.css">',`<style>${css}</style>`)
  .replace('<link rel="icon" type="image/svg+xml" href="icon.svg">',`<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(icon)}">`)
  .replace('  <script src="data.js" defer></script>\n  <script src="app.js" defer></script>','')
  .replace('<a href="finanzcoach-offline.html" download>Offline-Version ↓</a>','<span>Offline-Version · Stand 27.10.2026</span>')
  .replace('</body>',`<script>${js.replace(/<\/script/gi,'<\\/script')}</script>\n</body>`);
await writeFile(path.join(root,'dist','finanzcoach-offline.html'),html);
console.log('Offline-Version erstellt. Keine externen Dateien erforderlich.');
