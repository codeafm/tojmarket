// generate-favicon.cjs
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Создаем папку public/icons если её нет
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG логотип как на картинке (TM)
const svgLogo = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f6bdc"/>
      <stop offset="100%" stop-color="#6d3fc8"/>
    </linearGradient>
  </defs>

  <!-- Фон -->
  <rect width="512" height="512" rx="120" fill="url(#grad)"/>

  <!-- Текст TM по центру -->
  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="200"
    font-weight="700"
    fill="white"
    letter-spacing="10"
  >
    TM
  </text>
</svg>
`;

// Сохраняем SVG
fs.writeFileSync(path.join(iconsDir, 'logo.svg'), svgLogo);
console.log('✅ Создан SVG логотип');

// Размеры иконок
const sizes = [
  { size: 16, name: 'favicon-16x16' },
  { size: 32, name: 'favicon-32x32' },
  { size: 48, name: 'favicon-48x48' },
  { size: 96, name: 'favicon-96x96' },

  { size: 57, name: 'apple-icon-57x57' },
  { size: 60, name: 'apple-icon-60x60' },
  { size: 72, name: 'apple-icon-72x72' },
  { size: 76, name: 'apple-icon-76x76' },
  { size: 114, name: 'apple-icon-114x114' },
  { size: 120, name: 'apple-icon-120x120' },
  { size: 144, name: 'apple-icon-144x144' },
  { size: 152, name: 'apple-icon-152x152' },
  { size: 180, name: 'apple-icon-180x180' },

  { size: 192, name: 'android-icon-192x192' },
  { size: 384, name: 'android-icon-384x384' },
  { size: 512, name: 'android-icon-512x512' }
];

async function generateIcons() {
  try {
    const svgBuffer = Buffer.from(svgLogo);

    for (const { size, name } of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `${name}.png`));

      console.log(`✅ Создан ${name}.png (${size}x${size})`);
    }

    // favicon.ico
    await sharp(svgBuffer)
      .resize(32, 32)
      .toFile(path.join(__dirname, 'public', 'favicon.ico'));

    console.log('✅ favicon.ico создан');

    console.log('\n🎉 Все иконки успешно созданы!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

generateIcons();