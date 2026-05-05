import sharp from './node_modules/sharp/lib/index.js'
import { readFileSync } from 'fs'

const svg = readFileSync('./public/pwa-icon.svg')

const icons = [
  ['apple-touch-icon-180x180.png', 180],
  ['pwa-64x64.png',                64],
  ['pwa-192x192.png',             192],
  ['pwa-512x512.png',             512],
  ['maskable-icon-512x512.png',   512],
]

for (const [filename, size] of icons) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`./public/${filename}`)
  console.log(`✔ ${filename} (${size}x${size})`)
}

// favicon.ico a partir do 64x64
await sharp(svg).resize(32, 32).png().toFile('./public/favicon-32.png')
import { createWriteStream } from 'fs'
// copia o 32px como favicon.ico (browsers aceitam PNG renomeado como .ico)
const ico = readFileSync('./public/favicon-32.png')
import { writeFileSync } from 'fs'
writeFileSync('./public/favicon.ico', ico)
console.log('✔ favicon.ico')
