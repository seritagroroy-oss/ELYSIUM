const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text(), msg.location()));
        page.on('pageerror', error => console.log('PAGE ERROR:\n', error.stack));
        
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
        
        await browser.close();
    } catch (e) {
        console.error('Puppeteer Error:', e);
    }
})();
