import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const outDir = path.join(process.cwd(), "public", "icons");
await fs.mkdir(outDir, { recursive: true });

const sizes = [192, 512];

for (const size of sizes) {
  const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#1a4d3e"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-family="Georgia, serif" font-size="${size * 0.42}" fill="#f0f7f4">Σ</text>
</svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outDir, `icon-${size}x${size}.png`));
}

console.log("PWA icons written to public/icons/");
