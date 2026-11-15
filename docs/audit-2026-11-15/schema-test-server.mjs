import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const root=process.argv[2];const instances=[];
for(const [type,port] of [['fresh',55432],['legacy',55433]]) {
  const db=await PGlite.create();
  await db.exec(readFileSync(join(root,type==='fresh'?'database_setup.sql':'icrowd_api/src/test/resources/legacy-bootstrap.sql'),'utf8'));
  await db.exec(readFileSync(join(root,'database_migrations/20261115_security_performance.sql'),'utf8'));
  const server=new PGLiteSocketServer({db,host:'127.0.0.1',port});await server.start();
  instances.push({db,server});console.log(type+' ready on '+port);
}
process.on('SIGINT',async()=>{for(const {db,server} of instances){await server.stop();await db.close();}process.exit(0);});
