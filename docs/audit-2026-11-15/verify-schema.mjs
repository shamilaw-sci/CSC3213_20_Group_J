import {PGlite} from '@electric-sql/pglite';
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const root=process.argv[2];
const setup=readFileSync(join(root,'database_setup.sql'),'utf8');
const upgrade=readFileSync(join(root,'database_migrations/20261115_security_performance.sql'),'utf8');
const legacy=readFileSync(join(root,'icrowd_api/src/test/resources/legacy-bootstrap.sql'),'utf8');
const columns="select table_name,column_name,data_type from information_schema.columns where table_schema='public' order by table_name,column_name";
const results=[];
async function scenario(name,fn) {const db=new PGlite();try {await fn(db);results.push({name,passed:true});console.log('PASS',name);} catch(e){results.push({name,passed:false,message:e.message});console.error('FAIL',name,e.message);process.exitCode=1;}finally {await db.close();}}
let current=[];
await scenario('fresh schema and repeated upgrade',async db=>{await db.exec(setup);current=(await db.query(columns)).rows;await db.exec(upgrade);await db.exec(upgrade);assert.deepEqual((await db.query(columns)).rows,current);});
await scenario('legacy empty bootstrap upgrade matches mapped column types',async db=>{await db.exec(legacy);await db.exec(upgrade);const actual=(await db.query(columns)).rows;for(const col of current)assert.ok(actual.some(c=>c.table_name===col.table_name&&c.column_name===col.column_name&&(c.data_type===col.data_type || [c.data_type,col.data_type].every(t=>['text','character varying'].includes(t)))),JSON.stringify(col));});
await scenario('mixed case account duplicates stop migration atomically',async db=>{await db.exec(legacy);await db.exec("INSERT INTO users(email,password) VALUES('First@example.com','test-only'),('FIRST@example.com','test-only')");await assert.rejects(db.exec(upgrade),/duplicate emails/);await db.exec('ROLLBACK');assert.equal((await db.query('select count(*)::int as count from users')).rows[0].count,2);});
await scenario('legacy allocated order ambiguity stops migration',async db=>{await db.exec(legacy);await db.exec("INSERT INTO users(email,password) VALUES('buyer@example.com','test-only'); INSERT INTO orders(user_id,total_amount,status,delivery_type,shipping_cost,sub_total,payment_method,payment_status) VALUES(1,100,'PENDING_PAYMENT','STANDARD',0,100,'CARD','PENDING')");await assert.rejects(db.exec(upgrade),/allocation state is unknown/);await db.exec('ROLLBACK');});
await scenario('current orders retain totals and allocations through upgrade',async db=>{await db.exec(setup);await db.exec("INSERT INTO users(email,password,role,account_status,token_version,created_at,updated_at) VALUES('buyer@example.com','test-only','CUSTOMER','ACTIVE',1,now(),now()); INSERT INTO orders(user_id,total_amount,stock_allocated,status,delivery_type,shipping_cost,sub_total,discount,payment_method,payment_status,currency,created_at,updated_at) VALUES(1,123.45,true,'PROCESSING','STANDARD',0,123.45,0,'CARD','SUCCESS','LKR',now(),now())");await db.exec(upgrade);const o=(await db.query('select total_amount,stock_allocated from orders')).rows[0];assert.equal(o.total_amount,'123.45');assert.equal(o.stock_allocated,true);});
writeFileSync(join(root,'docs/audit-2026-11-15/schema-verification.json'),JSON.stringify({engine:'PGlite (isolated PostgreSQL WebAssembly)',results},null,2)+'\n');
