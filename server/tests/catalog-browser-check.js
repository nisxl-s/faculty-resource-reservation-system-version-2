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
      if(role==='admin'){
        await page.goto('http://127.0.0.1:3000/resource-management');
        await page.getByRole('heading',{name:'Faculty & asset structure'}).waitFor();
        await page.locator('#catalog-faculty').click();
        await page.getByRole('option',{name:'Faculty of Applied Sciences',exact:true}).click();
        assert.ok((await page.locator('#catalog-faculty').textContent()).includes('Faculty of Applied Sciences'));
        await page.locator('input[name="name"]').fill('Browser catalogue test room');
        await page.locator('#catalog-code').fill('BROWSER-ROOM-01');
        await page.locator('input[name="building"]').fill('Test Building');
        await page.locator('input[name="location"]').fill('Test Room');
        await page.locator('input[name="capacity"]').fill('25');
        const saved=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/resources'));
        await page.getByRole('button',{name:'Add Resource',exact:true}).click();
        const savedResponse=await saved;assert.equal(savedResponse.status(),201);const savedData=await savedResponse.json();
        const created=savedData.data.resource;assert.equal(created.faculty_code,'FAS');assert.equal(created.asset_code,'BROWSER-ROOM-01');
        const removed=await fetch(base+'/resources/'+created.id,{method:'DELETE',headers:{Authorization:'Bearer '+tokens.admin}});assert.equal(removed.status,200);
        await page.reload();await page.getByRole('heading',{name:'Faculty & asset structure'}).waitFor();
        await page.locator('.rm-table tbody tr').first().waitFor();
        await page.locator('#rm-resource-search').fill('unmatched-resource-xyz');
        await page.getByRole('heading',{name:'No matching resources'}).waitFor();
        await page.locator('#rm-resource-search').fill('projector');
        await page.locator('.rm-table tbody tr').first().waitFor();
        assert.ok((await page.locator('.rm-table tbody').innerText()).toLowerCase().includes('projector'));
        await page.locator('#rm-filter-faculty').click();await page.getByRole('option',{name:'Faculty of Applied Sciences',exact:true}).click();
        await page.getByRole('heading',{name:'No matching resources'}).waitFor();
        await page.locator('.rm-filter-actions').getByRole('button',{name:'Reset filters'}).click();
        await page.locator('.rm-table tbody tr').first().waitFor();
        assert.equal(await page.locator('#rm-resource-search').inputValue(),'');
        for(const width of [1440,768,360]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'resource admin fits '+width);if(directory)await page.screenshot({path:path.join(directory,'catalog-admin-'+width+'.png'),fullPage:true});}
      }
      await page.goto('http://127.0.0.1:3000/browse-resources');
      const facultySelect=page.getByRole('button',{name:'Filter by faculty or campus inventory'});await facultySelect.waitFor();
      await facultySelect.click();await page.getByRole('option',{name:'Faculty of Computing',exact:true}).click();await page.locator('.br-card').first().waitFor();assert.ok(await page.locator('.br-card').count()>0);
      await facultySelect.click();await page.getByRole('option',{name:'Faculty of Applied Sciences',exact:true}).click();await page.getByRole('heading',{name:'No Matching Facilities'}).waitFor();
      await facultySelect.click();await page.getByRole('option',{name:'All faculties',exact:true}).click();
      for(const width of [1440,768,360]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'resource browse fits '+width);if(directory)await page.screenshot({path:path.join(directory,'catalog-browse-'+role+'-'+width+'.png'),fullPage:true});}
      await page.setViewportSize({width:1440,height:1000});
      assert.deepEqual(errors,[],role+' catalogue has no browser errors');
      await context.close();
    }
    console.log('Catalogue browser checks passed: faculty filtering, admin fields, desktop/tablet/mobile layouts, no browser errors.');
  } finally { await browser.close(); }
};
