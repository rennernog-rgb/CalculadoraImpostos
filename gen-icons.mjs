import sharp from './node_modules/sharp/lib/index.js'
import { readFileSync, writeFileSync } from 'fs'

const svg = readFileSync('./public/pwa-icon.svg')
const bg  = { r: 17, g: 17, b: 24 }   // #111118

const icons = [
  ['apple-touch-icon-180x180.png', 180],
  ['pwa-64x64.png',                64],
  ['pwa-192x192.png',             192],
  ['pwa-512x512.png',             512],
  ['maskable-icon-512x512.png',   512],
]

for (const [filename, size] of icons) {
  await sharp(svg)
    .flatten({ background: bg })   // remove canal alpha — fundo sólido #111118
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(`./public/${filename}`)
  console.log(`✔ ${filename} (${size}×${size})`)
}

// favicon.ico
const ico = await sharp(svg)
  .flatten({ background: bg })
  .resize(32, 32)
  .png()
  .toBuffer()
writeFileSync('./public/favicon.ico', ico)
console.log('✔ favicon.ico')
