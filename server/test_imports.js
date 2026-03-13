import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import tesseract from 'tesseract.js';
console.log("Imports succeeded in ESM!");
