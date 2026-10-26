import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadTokenSources, resolveTokens, themes, highContrastTokens } from './build-tokens.mjs';

export function parseColor(value) {
  const match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value.trim());
  if (!match) throw new Error(`Contrast requires an opaque hex colour, received ${value}.`);
  const hex = match[1].length === 3 ? [...match[1]].map(character => character + character).join('') : match[1];
  return [0, 2, 4].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
}

export function luminance(color) {
  const channels = typeof color === 'string' ? parseColor(color) : color;
  const linear = channels.map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
}

export function contrastRatio(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

export function composite(foreground, background, alpha) {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new Error(`Invalid surface alpha: ${alpha}`);
  const front = typeof foreground === 'string' ? parseColor(foreground) : foreground;
  const back = typeof background === 'string' ? parseColor(background) : background;
  return front.map((channel, index) => channel * alpha + back[index] * (1 - alpha));
}

function colorToken(tokens, name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Circular colour token: ${name}`);
  seen.add(name);
  const value = tokens[name];
  if (typeof value !== 'string') throw new Error(`Missing contrast token: ${name}`);
  const variable = /^var\(--([\w-]+)\)$/.exec(value);
  if (variable) return colorToken(tokens, variable[1], seen);
  const mix = /^color-mix\(in srgb, var\(--([\w-]+)\) ([\d.]+)%, var\(--([\w-]+)\)\)$/.exec(value);
  if (mix) return composite(colorToken(tokens, mix[1], new Set(seen)), colorToken(tokens, mix[3], new Set(seen)), Number(mix[2]) / 100);
  return parseColor(value);
}

function saturate(color, amount) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`Invalid surface saturation: ${amount}`);
  // CSS filter saturation operates on encoded sRGB, before alpha compositing.
  const gray = color[0] * .213 + color[1] * .715 + color[2] * .072;
  return color.map(channel => Math.max(0, Math.min(1, gray + (channel - gray) * amount)));
}

export function contrastMatrix(sources) {
  const results = [];
  const errors = [];
  let combinations = 0;
  const add = (appearance, foreground, background, minimum, label) => {
    const ratio = contrastRatio(foreground, background);
    const row = { ...appearance, pair: label, ratio, minimum, pass: ratio >= minimum };
    results.push(row);
    if (!row.pass) errors.push(`Contrast ${appearance.theme}/${appearance.palette}/${appearance.kit}/${appearance.contrast}: ${label} ${ratio.toFixed(2)}:1 < ${minimum}:1.`);
  };
  for (const contrast of ['normal', 'more']) for (const theme of themes) {
    for (const palette of Object.keys(sources.palettes)) {
      for (const kit of sources.kits) {
        const appearance = { theme, palette, kit: kit.id, contrast };
        const tokens = { ...resolveTokens(sources, theme, palette, kit.id), ...(contrast === 'more' ? highContrastTokens : {}) };
        const color = name => colorToken(tokens, name);
        combinations++;
        const backgrounds = ['surface', 'surface-soft', 'bg'].map(name => [name, color(name)]);
        const alpha = Number(tokens['surface-alpha']);
        if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new Error(`Invalid surface alpha in ${kit.id}/${theme}.`);
        if (alpha < 1) {
          const backdrops = ['black', 'white'].map(name => [name, parseColor(sources.primitives.color[name])]);
          const saturation = Number(tokens['surface-saturation']);
          const layers = [['glass', alpha]];
          if (tokens['card-alpha'] !== undefined) {
            const cardAlpha = Number(tokens['card-alpha']);
            if (!Number.isFinite(cardAlpha) || cardAlpha < 0 || cardAlpha > 1) throw new Error(`Invalid card alpha in ${kit.id}/${theme}.`);
            layers.push(['card', cardAlpha]);
            // These are the actual palette mesh's three opaque regions.
            // Keep black/white as conservative bounds for scrolling content;
            // mesh extrema supplement those bounds, never replace them.
            const mesh = ['bg', 'ambient-start', 'ambient-end'].map(name => [name, color(name)]);
            const ordered = [...mesh].sort((a, b) => luminance(a[1]) - luminance(b[1]));
            backgrounds.push(['mesh darkest region', ordered[0][1]], ['mesh lightest region', ordered.at(-1)[1]]);
            for (const [name, region] of mesh) {
              backgrounds.push([`mesh ${name}`, region]);
              backdrops.push([`mesh ${name}`, region]);
            }
          }
          for (const [backdropName, backdrop] of backdrops) {
            for (const [layer, layerAlpha] of layers) {
              backgrounds.push([`${layer} over ${backdropName}`, composite(color('surface'), saturate(backdrop, saturation), layerAlpha)]);
            }
          }
        }
        for (const [backgroundName, background] of backgrounds) {
          for (const foreground of ['text', 'muted', 'accent-text']) add(appearance, color(foreground), background, 4.5, `${foreground} on ${backgroundName}`);
          add(appearance, color('text'), background, 4.5, `small nav-count on ${backgroundName}`);
          for (const foreground of ['focus-ring', 'border']) add(appearance, color(foreground), background, 3, `${foreground} against ${backgroundName}`);
        }
        for (let index = 1; index <= 8; index++) {
          add(appearance, color(`series-${index}`), color('surface'), 3, `series-${index} against surface`);
        }
        add(appearance, sources.primitives.color.white, color('accent'), 4.5, 'white label on accent button');
        add(appearance, color('accent-contrast'), color('accent'), 4.5, 'accent-contrast label on accent button');
        add(appearance, color('accent-text'), color('accent-soft'), 4.5, 'accent-text on accent-soft');
        // Counts and badges remain normal-sized text even when their labels are bold.
        // Navigation covers transparent/hover surfaces above and active accent-soft here.
        add(appearance, color('text'), color('accent-soft'), 4.5, 'small nav-count on active accent-soft');
        add(appearance, color('muted'), color('bg'), 4.5, 'small neutral badge on bg');
        add(appearance, color('accent-text'), color('accent-soft'), 4.5, 'small accent badge on accent-soft');
        add(appearance, color('accent-contrast'), color('accent'), 4.5, 'small notification count on accent');
        for (const status of ['success', 'warning', 'danger', 'info']) {
          add(appearance, color(`${status}-text`), color(`${status}-soft`), 4.5, `${status}-text on ${status}-soft`);
          add(appearance, color(`${status}-text`), color(`${status}-soft`), 4.5, `small ${status} badge on ${status}-soft`);
        }
      }
    }
  }
  return { combinations, results, errors };
}

export async function checkContrast(root = '.') {
  return contrastMatrix(await loadTokenSources(root));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const report = await checkContrast(process.argv[2]);
  if (report.errors.length) {
    for (const error of report.errors) console.error(error);
    process.exitCode = 1;
  } else console.log(`Contrast passed: ${report.combinations} theme × palette × kit × contrast combinations, ${report.results.length} pairs (including worst-case glass backdrops).`);
}
