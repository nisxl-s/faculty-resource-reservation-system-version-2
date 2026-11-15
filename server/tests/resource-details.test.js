const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalizeDetails,parseDetails,attendeeCount}=require('../src/utils/resourceDetails');
test('resource details enforce type boundaries, text limits and enumerated choices',()=>{
 assert.deepEqual(normalizeDetails('hall',{layout:'theatre',facilities:' Projector '}),{layout:'theatre',facilities:'Projector'});
 assert.deepEqual(normalizeDetails('equipment',{brand_model:' Camera ',condition:'good'}),{brand_model:'Camera',condition:'good'});
 for(const value of [[], 'text', 10]) assert.throws(()=>normalizeDetails('hall',value),/object/);
 assert.throws(()=>normalizeDetails('hall',{asset_tag:'x'}),/not supported/);
 assert.throws(()=>normalizeDetails('equipment',{layout:'theatre'}),/not supported/);
 assert.throws(()=>normalizeDetails('equipment',{condition:'broken'}),/condition/);
 assert.throws(()=>normalizeDetails('hall',{layout:'unknown'}),/layout/);
 assert.throws(()=>normalizeDetails('hall',{floor_area:'x'.repeat(101)}),/100/);
 assert.throws(()=>normalizeDetails('hall',JSON.parse('{"__proto__":"bad"}')),/not supported/);
 assert.deepEqual(parseDetails(null),{});assert.deepEqual(parseDetails('bad'),{});
 assert.deepEqual(parseDetails('{"layout":"theatre"}'),{layout:'theatre'});
});
test('seating applies to spaces and never treats equipment as attendee capacity',()=>{
 assert.equal(attendeeCount({type:'hall',capacity:50},'50'),50);
 for(const value of [51,0,-1,1.5,'2abc',false])assert.throws(()=>attendeeCount({type:'hall',capacity:50},value));
 assert.equal(attendeeCount({type:'hall',capacity:50},null),null);
 assert.equal(attendeeCount({type:'equipment',capacity:1},100),null);
});
