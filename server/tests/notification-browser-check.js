const assert=require('node:assert/strict');
module.exports=async function({base,tokens,users}){
  const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
  const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});
  try {
    const create=await fetch(base+'/notifications',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tokens.admin},body:JSON.stringify({user_id:users.student,title:'Browser unread persistence',message:'Unread for the recipient'})});assert.equal(create.status,201);
    for(const role of ['admin','student']){
      const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
      await context.addInitScript(({token,user})=>{localStorage.setItem('token',token);localStorage.setItem('user',JSON.stringify(user));},{token:tokens[role],user:{id:users[role],role,full_name:role,email:role+'@example.test'}});
      let rejectBulk=false;
      await context.route('**/api/**',async route=>{const url=new URL(route.request().url());if(rejectBulk&&url.pathname.endsWith('/notifications/read-all')&&route.request().method()==='PATCH')return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,message:'Temporary notification failure'})});const suffix=url.pathname.slice(url.pathname.indexOf('/api')+4);const response=await route.fetch({url:base+suffix+url.search});await route.fulfill({response});});
      const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto('http://127.0.0.1:3000/notify');
      const markAll=page.getByRole('button',{name:'Mark all as read',exact:true});await markAll.waitFor();
      rejectBulk=true;await markAll.click();await page.getByRole('alert').filter({hasText:'Temporary notification failure'}).waitFor();assert.equal(await markAll.isEnabled(),true,'failed request allows retry');
      rejectBulk=false;await markAll.click();await markAll.waitFor({state:'hidden'});
      await Promise.all([page.waitForResponse(response=>response.url().includes('/notifications')&&response.request().method()==='GET'),page.reload()]);
      await page.waitForFunction(()=>!document.querySelector('p[role="status"]'));
      assert.equal(await page.locator('.nt-unread-badge').count(),0,role+' unread badge stays cleared after reload');
      assert.equal(await markAll.count(),0,role+' does not return to unread after reload');assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('Browser verified: notification bulk-read persists after reload for admin and member; failures are visible and retryable.');
  }finally{await browser.close();}
};
