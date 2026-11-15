const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
module.exports=async function({base,token,userId,resourceId,booking}){
 const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});
 try{
  for(const width of [1440,360]){
   const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
   await context.addInitScript(({token,userId})=>{localStorage.setItem('token',token);localStorage.setItem('user',JSON.stringify({id:userId,role:'student',full_name:'Booking test student'}));window.bookingScrollCalls=0;const original=window.scrollTo.bind(window);window.scrollTo=(...args)=>{window.bookingScrollCalls++;return original(...args);};},{token,userId});
   await context.route('**/api/**',async route=>{const url=new URL(route.request().url());const suffix=url.pathname.slice(url.pathname.indexOf('/api')+4);const response=await route.fetch({url:base+suffix+url.search});await route.fulfill({response});});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:3000/book-resource/'+resourceId);
   await page.getByRole('button',{name:'Submit Reservation',exact:true}).waitFor();
   function parts(value){const p=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Colombo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)).map(x=>[x.type,x.value]));return {date:p.year+'-'+p.month+'-'+p.day,hour:p.hour,minute:p.minute};}
   for(const [prefix,value]of [['start',booking.start_time],['end',booking.end_time]]){
    const p=parts(value);await page.getByRole('button',{name:prefix+' date',exact:true}).click();await page.getByRole('button',{name:p.date,exact:true}).click();
    for(const [unit,v]of [['hour',p.hour],['minute',p.minute]]){await page.getByRole('button',{name:prefix+' time '+unit,exact:true}).click();await page.getByRole('option',{name:v,exact:true}).click();}
   }
   await page.locator('#purpose').fill('Checking duplicate booking error visibility');
   await page.locator('#attendees').fill('1');
   const submit=page.getByRole('button',{name:'Submit Reservation',exact:true});await submit.scrollIntoViewIfNeeded();await submit.focus();
   await page.evaluate(()=>{window.bookingScrollCalls=0;});
   const rejected=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/reservations'));
   await submit.click();assert.equal((await rejected).status(),409);
   const notice=page.locator('#booking-submit-error');await notice.waitFor();assert.match(await notice.textContent(),/already booked|already reserved/i);
   assert.equal(await page.evaluate(()=>window.bookingScrollCalls),0,'submission does not scroll to the top');
   const box=await notice.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=1000,'conflict notice stays in the viewport at '+width);
   assert.equal(await page.locator('#purpose').inputValue(),'Checking duplicate booking error visibility');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const directory=process.env.BROWSER_SCREENSHOTS;if(directory){fs.mkdirSync(directory,{recursive:true});await page.screenshot({path:path.join(directory,'booking-conflict-'+width+'.png')});}
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('Booking error browser checks passed: real conflict displayed beside submit, no automatic scrolling, entered details preserved, desktop/mobile.');
 }finally{await browser.close();}
};

