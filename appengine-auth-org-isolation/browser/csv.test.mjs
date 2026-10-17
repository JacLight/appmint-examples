import {strict as assert} from 'node:assert';import{csvCell}from'./csv.mjs';
for(const v of ['=1+1','+SUM(A1)','-2+3','@SUM(A1)','  =1+1','\tvalue','\rvalue','\nvalue'])assert.ok(csvCell(v).startsWith('"\''));
assert.equal(csvCell('Say "hello"'),'"Say ""hello"""');assert.equal(csvCell('ordinary'),'"ordinary"');assert.equal(csvCell(null),'""');console.log('CSV formula and quoting checks passed');
