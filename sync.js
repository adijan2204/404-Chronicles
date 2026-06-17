import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORTFOLIO_DIR = path.join(__dirname, 'assets', 'portfolio');
const OUTPUT_FILE = path.join(__dirname, 'assets', 'portfolio-data.js');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function cleanTitle(name) {
    // Replace underscores, dashes, multiple spaces with single space
    name = name.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    return name;
}

function getExifDefaults(category) {
    switch (category.toLowerCase()) {
        case 'street':
            return {
                camera: 'Canon 5D Mark IV',
                lens: '24-105mm',
                aperture: 'f/4.0'
            };
        case 'landscape':
            return {
                camera: 'Canon 5D Mark IV',
                lens: 'RF 50mm',
                aperture: 'f/1.8'
            };
        default:
            return {
                camera: 'Canon 5D Mark IV',
                lens: 'RF 50mm',
                aperture: 'f/1.8'
            };
    }
}

function parseImageFilename(filename, category) {
    const ext = path.extname(filename);
    const nameWithoutExt = path.basename(filename, ext);
    
    // Check for double underscore separator for EXIF details (e.g., Title__Camera__Lens__Aperture.jpg)
    const parts = nameWithoutExt.split('__');
    const defaults = getExifDefaults(category);
    
    let title = cleanTitle(parts[0]);
    let camera = defaults.camera;
    let lens = defaults.lens;
    let aperture = defaults.aperture;
    
    if (parts.length > 1 && parts[1].trim()) camera = parts[1].trim();
    if (parts.length > 2 && parts[2].trim()) lens = parts[2].trim();
    if (parts.length > 3 && parts[3].trim()) aperture = parts[3].trim();
    
    // Format aperture with f/ if it's just a number
    if (aperture && !aperture.toLowerCase().startsWith('f/')) {
        aperture = 'f/' + aperture;
    }
    
    return {
        title,
        camera,
        lens,
        aperture
    };
}

function runSync() {
    console.log('Scanning portfolio directories...');
    if (!fs.existsSync(PORTFOLIO_DIR)) {
        console.error(`Portfolio directory not found: ${PORTFOLIO_DIR}`);
        return;
    }
    
    const categories = fs.readdirSync(PORTFOLIO_DIR).filter(file => {
        const fullPath = path.join(PORTFOLIO_DIR, file);
        return fs.statSync(fullPath).isDirectory();
    });
    
    const items = [];
    
    categories.forEach(category => {
        const categoryDir = path.join(PORTFOLIO_DIR, category);
        const files = fs.readdirSync(categoryDir);
        
        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (IMAGE_EXTENSIONS.includes(ext)) {
                const relativeSrc = `assets/portfolio/${category}/${file}`;
                const meta = parseImageFilename(file, category);
                
                items.push({
                    src: relativeSrc,
                    category: category,
                    title: meta.title,
                    camera: meta.camera,
                    lens: meta.lens,
                    aperture: meta.aperture
                });
            }
        });
    });
    
    // Write out as a JS global variable so it works on file:// without CORS issues
    const outputContent = `window.portfolioData = ${JSON.stringify(items, null, 2)};`;
    fs.writeFileSync(OUTPUT_FILE, outputContent, 'utf8');
    console.log(`Successfully synced ${items.length} items to ${OUTPUT_FILE}`);
}

const isWatch = process.argv.includes('--watch');

if (isWatch) {
    console.log(`Watching ${PORTFOLIO_DIR} for changes recursively...`);
    runSync();
    
    let timeout;
    fs.watch(PORTFOLIO_DIR, { recursive: true }, (eventType, filename) => {
        if (filename) {
            const ext = path.extname(filename).toLowerCase();
            if (IMAGE_EXTENSIONS.includes(ext)) {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    console.log(`Change detected: ${filename}. Resynced.`);
                    runSync();
                }, 100);
            }
        }
    });
} else {
    runSync();
}
