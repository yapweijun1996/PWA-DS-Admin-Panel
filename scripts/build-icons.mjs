import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, checksum]);
}

function color(value) {
  const hex = value.trim().slice(1);
  const expanded = hex.length === 3 ? [...hex].map(character => character.repeat(2)).join('') : hex;
  if (!/^[a-f\d]{6}$/i.test(expanded)) throw new Error('Icon palette requires six-digit or three-digit hex tokens.');
  return [0, 2, 4].map(offset => Number.parseInt(expanded.slice(offset, offset + 2), 16));
}

export function generateIcon(size, palette) {
  const background = color(palette.accent.light);
  const foreground = color(palette.surface.light);
  const data = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    for (let x = 0; x < size; x++) {
      // A compact dashboard mark sits entirely inside the maskable safe zone.
      const nx = x / size;
      const ny = y / size;
      const left = nx >= 0.27 && nx < 0.46;
      const right = nx >= 0.52 && nx < 0.73;
      const mark = (left && ny >= 0.28 && ny < 0.72) || (right && ((ny >= 0.28 && ny < 0.46) || (ny >= 0.52 && ny < 0.72)));
      const pixel = mark ? foreground : background;
      const offset = row + 1 + x * 3;
      data[offset] = pixel[0];
      data[offset + 1] = pixel[1];
      data[offset + 2] = pixel[2];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(data)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export async function buildIcons(root = new URL('../', import.meta.url)) {
  const tokens = JSON.parse(await readFile(new URL('tokens/tokens.json', root), 'utf8'));
  await mkdir(new URL('icons/', root), { recursive: true });
  for (const size of [192, 512]) {
    const bytes = generateIcon(size, tokens.Color);
    await writeFile(new URL(`icons/icon-${size}.png`, root), bytes);
    if (size === 512) await writeFile(new URL('icons/icon-maskable-512.png', root), bytes);
  }
  const manifestURL = new URL('manifest.webmanifest', root);
  const manifest = JSON.parse(await readFile(manifestURL, 'utf8'));
  manifest.theme_color = tokens.Color.surface.light;
  manifest.background_color = tokens.Color.bg.light;
  await writeFile(manifestURL, `${JSON.stringify(manifest, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await buildIcons();
