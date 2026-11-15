const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async function browserCheck({ base, tokens, users }) {
  const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
  const directory = process.env.BROWSER_SCREENSHOTS;
  if (directory) fs.mkdirSync(directory, {recursive:true});
  try {
    for (const role of ['faculty','admin','student']) {
      const context = await browser.newContext({ viewport: {width:1440,height:1000}, reducedMotion:'reduce' });
      await context.addInitScript(({token,user}) => {
        localStorage.setItem('token',token); localStorage.setItem('user',JSON.stringify(user));
      }, {token:tokens[role],user:{id:users[role],role,full_name:'Test '+role,email:role+'@example.test'}});
      // I connect the browser to the temporary test API using its actual responses.
      await context.route('**/api/**',async route => {
        const original=new URL(route.request().url());
        const suffix=original.pathname.slice(original.pathname.indexOf('/api')+4);
        const response=await route.fetch({url:base+suffix+original.search});
        await route.fulfill({response});
      });
      const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const route=role==='student'?'/student-profile':'/booking-history';
      await page.goto('http://127.0.0.1:3000'+route);
      await page.getByRole('button',{name:'Help',exact:true}).waitFor();
      assert.equal(await page.locator('.nav-item').filter({hasText:/Review bookings|Support review|My support/}).count(),0);
      if(role !== 'student') await page.locator('.bh-page, .bh-container, .bh-stat-card').first().waitFor();
      await page.getByRole('button',{name:'Help',exact:true}).click();
      await page.getByRole('button',{name:role==='admin'?'My support history':'My requests & replies',exact:true}).click();
      await page.locator('.support-inbox h3').waitFor();
      if(role !== 'student') {
        await page.getByRole('button',{name:role==='admin'?'Support inbox':'Respond to requests',exact:true}).click();
        await page.getByRole('heading',{name:'Support review',exact:true}).waitFor();
      }
      await page.waitForFunction(()=>!document.querySelector('[aria-busy="true"]'));
      for(const width of [1440,768,360]){
        await page.setViewportSize({width,height:1000});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),role+' layout fits '+width);
        if(directory)await page.screenshot({path:path.join(directory,role+'-'+width+'.png'),fullPage:true});
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('dialog').count(),0);
      const menu=page.getByRole('button',{name:'Toggle navigation'});
      if(await menu.isVisible()){
        await menu.focus();await page.keyboard.press('Enter');
        assert.equal(await menu.getAttribute('aria-expanded'),'true');
        await page.keyboard.press('Enter');
        await menu.click();
      }
      await page.getByRole('button',{name:'Logout',exact:true}).click();
      await page.getByRole('dialog').waitFor();
      assert.equal(await page.evaluate(()=>document.activeElement.textContent.trim()),'Stay Logged In');
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.textContent.trim()),'Log Out');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      assert.equal(await page.getByRole('dialog').count(),0,'Enter on cancellation does not confirm logout');
      assert.ok(await page.evaluate(()=>localStorage.getItem('token')));
      assert.deepEqual(errors,[],role+' screen has no uncaught browser errors');
      await context.close();
    }
    console.log('Browser verified: integrated Reservations, floating support review and member replies at 1440/768/360px, plus keyboard menu operation.');
  } finally { await browser.close(); }
};
