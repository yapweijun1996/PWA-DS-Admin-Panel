import {readFile,writeFile,mkdir} from 'node:fs/promises';
export function generate(tokens){return ['light','dark'].map(mode=>`${mode==='light'?':root':"[data-theme=dark]"} {\n${Object.values(tokens).flatMap(group=>Object.entries(group).map(([name,v])=>`  --${name}: ${v[mode]};`)).join('\n')}\n}`).join('\n')+'\n';}
if(process.argv[1]?.endsWith('build-tokens.mjs')){await mkdir('css',{recursive:true});await writeFile('css/tokens.css',generate(JSON.parse(await readFile('tokens/tokens.json','utf8'))));}
