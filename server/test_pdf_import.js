import fs from 'fs';
async function test() {
    const pdfModule = await import('pdf-parse');
    console.log("pdfModule keys:", Object.keys(pdfModule));
    console.log("pdfModule typeof:", typeof pdfModule);
    console.log("pdfModule.default:", pdfModule.default);
    console.log("pdfModule.default type:", typeof pdfModule.default);

    // Some libraries export the function on a differently named key or nested.
    if (pdfModule.PDFParse) {
        console.log("pdfModule.PDFParse type:", typeof pdfModule.PDFParse);
    }

    // Test the createRequire approach again, specifically printing the type
    import('module').then(({ createRequire }) => {
        const require = createRequire(import.meta.url);
        const pdfParseCJS = require('pdf-parse');
        console.log("require('pdf-parse') type:", typeof pdfParseCJS);
        console.log("require('pdf-parse') keys:", Object.keys(pdfParseCJS));
    });
}
test();
