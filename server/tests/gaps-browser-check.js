const assert=require('node:assert/strict');
module.exports=async function({base,tokens,users,resourceId}){
  const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
  const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});
  async function context(role){const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});if(role)await context.addInitScript(({token,user})=>{localStorage.setItem('token',token);localStorage.setItem('user',JSON.stringify(user));},{token:tokens[role],user:{id:users[role],role,full_name:'Test '+role,email:role+'@example.test'}});await context.route('**/api/**',async route=>{const url=new URL(route.request().url());const response=await route.fetch({url:base+url.pathname.slice(url.pathname.indexOf('/api')+4)+url.search});await route.fulfill({response});});return context;}
  const errors=[];
  async function page(context){const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));return page;}
  try {
    const guest=await context();const gp=await page(guest);
    await gp.goto('http://127.0.0.1:3000/no-such-page');await gp.getByRole('heading',{name:'Page not found',exact:true}).waitFor();
    await gp.goto('http://127.0.0.1:3000/help');await gp.getByRole('button',{name:'Submit Help Request',exact:true}).click();
    await gp.getByLabel('Email address',{exact:true}).fill('browser-guest@example.test');await gp.getByLabel('Topic / Category *',{exact:true}).fill('Guest browser request');await gp.getByLabel('Your Question / Issue *',{exact:true}).fill('Please help me understand the booking workflow.');
    await gp.getByRole('button',{name:'Submit Request',exact:true}).click();
    const text=await gp.locator('.help-success-message').innerText();const match=/Request #(\d+) — Tracking code: ([a-f0-9]{64})/.exec(text);assert.ok(match,'guest receives private tracking code');
    const reply=await fetch(base+'/help/admin/'+match[1]+'/respond',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tokens.admin},body:JSON.stringify({admin_response:'Guest browser reply',status:'resolved'})});assert.equal(reply.status,200);
    await gp.getByLabel('Request number',{exact:true}).fill(match[1]);await gp.getByLabel('Private tracking code',{exact:true}).fill(match[2]);await gp.getByRole('button',{name:'View reply',exact:true}).click();await gp.getByText('Guest browser reply',{exact:true}).waitFor();
    await guest.close();
    const start=new Date(Date.now()+8*86400000),end=new Date(start.getTime()+3600000);
    const created=await fetch(base+'/reservations',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tokens.student},body:JSON.stringify({resource_id:resourceId,start_time:start.toISOString(),end_time:end.toISOString(),purpose:'Browser rejection test'})});assert.equal(created.status,201);const id=(await created.json()).data.reservation.id;
    const staff=await context('faculty');const sp=await page(staff);await sp.goto('http://127.0.0.1:3000/booking-history');
    const row=sp.locator('tbody tr').filter({has:sp.locator('.bh-td-id',{hasText:new RegExp('^#'+id+'$')})});await row.getByRole('button',{name:'Reject',exact:true}).click();
    await sp.getByLabel('Reason for rejection',{exact:true}).fill('Requested room needs maintenance');await sp.getByRole('button',{name:'Reject reservation',exact:true}).click();await sp.getByRole('dialog').waitFor({state:'hidden'});await row.getByText('Requested room needs maintenance',{exact:false}).waitFor();
    await staff.close();
    const member=await context('student');const mp=await page(member);await mp.goto('http://127.0.0.1:3000/my-reservations');const ownRow=mp.locator('tbody tr').filter({has:mp.locator('.bh-td-id',{hasText:new RegExp('^#'+id+'$')})});await ownRow.locator('.bh-btn-detail-toggle').click();await mp.locator('.bh-purpose-box').filter({hasText:'Requested room needs maintenance'}).waitFor();await mp.getByText('Decision history',{exact:true}).last().click();await mp.getByText(/status: pending → rejected/).waitFor();
    assert.deepEqual(errors,[],'new workflows have no uncaught browser errors');await member.close();
    console.log('Browser verified: not-found page, guest request/reply tracking, staff rejection reason and member decision history.');
  } finally {await browser.close();}
};
