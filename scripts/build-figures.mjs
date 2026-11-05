// Builds light and dark versions of every diagram in src/content/figures/.
// Each source SVG uses the class names below and has a <!--theme--> marker where the styles go.
// Output: public/images/<name>-light.svg and <name>-dark.svg (referenced by a slide's "figure").
// Run with: npm run figures
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Same palette as the tokens in src/styles.css.
const palette = {
  light: {
    bg: '#f2f6f8',
    surface: '#ffffff',
    sunk: '#edf3f7',
    ink: '#10212b',
    muted: '#4a6070',
    line: '#d5e0e7',
    accent: '#0a6ea6',
    accentInk: '#075585',
    accentSoft: '#ddeef9',
    onAccent: '#ffffff',
    pos: '#17906f',
    posInk: '#0b6b52',
    posSoft: '#d8f1e8',
    neg: '#d9532f',
    negInk: '#b3341a',
    negSoft: '#fbe1d8',
    heat: '#cc8200',
    heatInk: '#8a5a00',
    heatSoft: '#fbebcb',
  },
  dark: {
    bg: '#0f1413',
    surface: '#171e1c',
    sunk: '#1f2826',
    ink: '#e4ece9',
    muted: '#9aa9a4',
    line: '#2c3835',
    accent: '#4db3d1',
    accentInk: '#8fd3e6',
    accentSoft: '#163742',
    onAccent: '#0f1413',
    pos: '#3fc4a3',
    posInk: '#3fc4a3',
    posSoft: '#123a30',
    neg: '#f07d60',
    negInk: '#f07d60',
    negSoft: '#42221a',
    heat: '#f0ac40',
    heatInk: '#f0ac40',
    heatSoft: '#3d2e14',
  },
};

const css = (c) => `<style>
    .bg{fill:${c.bg}}.card{fill:${c.surface};stroke:${c.line}}.sunk{fill:${c.sunk}}
    .ink{fill:${c.ink}}.muted{fill:${c.muted}}.onacc{fill:${c.onAccent}}
    .acc{fill:${c.accent}}.accink{fill:${c.accentInk}}.accsoft{fill:${c.accentSoft}}
    .pos{fill:${c.pos}}.posink{fill:${c.posInk}}.possoft{fill:${c.posSoft};stroke:${c.pos}}
    .neg{fill:${c.neg}}.negink{fill:${c.negInk}}.negsoft{fill:${c.negSoft};stroke:${c.neg}}
    .heat{fill:${c.heatSoft};stroke:${c.heat}}.heatink{fill:${c.heatInk}}.heatfill{fill:${c.heat}}
    .line{stroke:${c.muted};fill:none;stroke-width:2}.thin{stroke:${c.line};fill:none;stroke-width:1.5}
    .dash{stroke:${c.accent};fill:none;stroke-width:2;stroke-dasharray:6 5}
    .stream{stroke:${c.accent};fill:none;stroke-width:14;stroke-linecap:round;opacity:.35}
    .row{fill:${c.sunk}}.hit{fill:${c.accentSoft};stroke:${c.accent}}
    .mono{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace}
    .head{font-size:13px;font-weight:700;letter-spacing:.08em}
    .arrowhead{fill:${c.muted}}.arrowacc{fill:${c.accent}}
  </style>`;

const srcDir = 'src/content/figures';
const outDir = 'public/images';
mkdirSync(outDir, { recursive: true });
for (const file of readdirSync(srcDir).filter((f) => f.endsWith('.svg'))) {
  const svg = readFileSync(join(srcDir, file), 'utf8');
  if (!svg.includes('<!--theme-->')) throw new Error(`${file} has no <!--theme--> marker`);
  for (const [name, colours] of Object.entries(palette)) {
    const out = join(outDir, file.replace(/\.svg$/, `-${name}.svg`));
    writeFileSync(out, svg.replace('<!--theme-->', css(colours)));
    console.log('wrote', out);
  }
}
