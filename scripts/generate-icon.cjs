const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const sharp = require('sharp')
const pngToIcoModule = require('png-to-ico')
const pngToIco = pngToIcoModule.default || pngToIcoModule

const rootDir = path.resolve(__dirname, '..')
const buildDir = path.join(rootDir, 'build')
const iconsetDir = path.join(buildDir, 'icon.iconset')
const linuxIconsDir = path.join(buildDir, 'icons')
const masterPngPath = path.join(buildDir, 'icon.png')
const icnsPath = path.join(buildDir, 'icon.icns')
const icoPath = path.join(buildDir, 'icon.ico')

const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2B3440"/>
      <stop offset="100%" stop-color="#11161D"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2F9CFD"/>
      <stop offset="100%" stop-color="#1A6EC1"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000000" flood-opacity="0.28"/>
    </filter>
  </defs>

  <rect x="64" y="64" width="896" height="896" rx="208" fill="url(#bg)"/>

  <rect x="220" y="200" width="584" height="650" rx="88" fill="#1E1E1E" stroke="#4D5660" stroke-width="20" filter="url(#shadow)"/>
  <rect x="350" y="136" width="324" height="152" rx="52" fill="#2A2D2E" stroke="#5C6773" stroke-width="18"/>

  <rect x="292" y="368" width="440" height="26" rx="13" fill="#3D434B"/>
  <rect x="292" y="430" width="390" height="26" rx="13" fill="#3D434B"/>
  <rect x="292" y="492" width="330" height="26" rx="13" fill="#3D434B"/>

  <path d="M548 576L436 744H518L476 876L650 658H566L608 576Z" fill="#F3A32F"/>
  <path d="M554 566L438 738H523L476 886L662 656H571L617 566Z" fill="url(#glow)" opacity="0.82"/>
</svg>
`

const iconsetSpecs = [
  ['icon_16x16.png', 16],
  ['icon_16x16@2x.png', 32],
  ['icon_32x32.png', 32],
  ['icon_32x32@2x.png', 64],
  ['icon_128x128.png', 128],
  ['icon_128x128@2x.png', 256],
  ['icon_256x256.png', 256],
  ['icon_256x256@2x.png', 512],
  ['icon_512x512.png', 512],
  ['icon_512x512@2x.png', 1024],
]

const linuxIconSizes = [16, 24, 32, 48, 64, 96, 128, 256, 512]

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
}

async function generatePngs() {
  fs.mkdirSync(buildDir, { recursive: true })
  const svgBuffer = Buffer.from(iconSvg)

  await sharp(svgBuffer).png({ compressionLevel: 9 }).toFile(masterPngPath)

  ensureCleanDir(iconsetDir)
  for (const [name, size] of iconsetSpecs) {
    const targetPath = path.join(iconsetDir, name)
    await sharp(svgBuffer).resize(size, size).png({ compressionLevel: 9 }).toFile(targetPath)
  }

  ensureCleanDir(linuxIconsDir)
  for (const size of linuxIconSizes) {
    const targetPath = path.join(linuxIconsDir, `${size}x${size}.png`)
    await sharp(svgBuffer).resize(size, size).png({ compressionLevel: 9 }).toFile(targetPath)
  }
}

function generateIcns() {
  if (process.platform !== 'darwin') {
    console.log('[icon] Skip build/icon.icns on non-macOS platform.')
    return
  }

  try {
    execFileSync('iconutil', ['-c', 'icns', iconsetDir, '-o', icnsPath], {
      cwd: rootDir,
      stdio: 'inherit',
    })
  } catch (error) {
    console.warn('[icon] Skip build/icon.icns:', error?.message || error)
  }
}

async function generateIco() {
  try {
    const icoSourceSizes = [16, 24, 32, 48, 64, 128, 256]
    const buffer = await pngToIco(
      icoSourceSizes.map((size) => path.join(linuxIconsDir, `${size}x${size}.png`))
    )
    fs.writeFileSync(icoPath, buffer)
  } catch (error) {
    console.warn('[icon] Skip build/icon.ico:', error?.message || error)
  }
}

async function main() {
  await generatePngs()
  generateIcns()
  await generateIco()
  console.log('[icon] Generated:')
  console.log(`- ${path.relative(rootDir, masterPngPath)}`)
  console.log(`- ${path.relative(rootDir, icnsPath)}`)
  console.log(`- ${path.relative(rootDir, linuxIconsDir)}/*`)
  if (fs.existsSync(icoPath)) {
    console.log(`- ${path.relative(rootDir, icoPath)}`)
  }
}

main().catch((error) => {
  console.error('[icon] generation failed:', error)
  process.exitCode = 1
})
