const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        page.on('response', response => {
            if (!response.ok()) {
                console.log('PAGE RESPONSE ERROR:', response.status(), response.url());
            }
        });

        await page.goto('http://127.0.0.1:8000/', { waitUntil: 'networkidle0' });
        
        const content = await page.content();
        console.log('HTML CONTENT:', content.substring(0, 500));
        
        await browser.close();
    } catch (e) {
        console.error('Puppeteer Error:', e);
    }
})();
