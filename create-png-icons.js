// Simple script to create PNG icons from SVG (for reference)
// You can use online tools like svg2png.com or design tools to convert

const iconSizes = [16, 32, 48, 96, 144, 192, 512];

console.log('To create PNG icons from your SVG files:');
console.log('1. Use an online converter like svg2png.com');
console.log('2. Or use a design tool like Figma/Sketch');
console.log('3. Create these sizes from icon.svg:');

iconSizes.forEach(size => {
  console.log(`   - icon-${size}x${size}.png`);
});

console.log('\n4. Update manifest.json to include PNG versions:');
console.log(`
"icons": [
  {
    "src": "/icon-192x192.png",
    "sizes": "192x192",
    "type": "image/png"
  },
  {
    "src": "/icon-512x512.png", 
    "sizes": "512x512",
    "type": "image/png"
  },
  {
    "src": "/favicon.svg",
    "sizes": "any",
    "type": "image/svg+xml"
  }
]
`);