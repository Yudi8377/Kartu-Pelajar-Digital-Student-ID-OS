import { createHash } from "node:crypto";
import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 10000 });
pool.on("error", (err) => console.error("[card-template-api] pool error", err?.message || "unknown"));
const allowedOrigins = new Set(["https://yudi8377.github.io","https://digital-card-os.hatchable.site","http://localhost:4173","http://127.0.0.1:4173"]);
const json = (data, status = 200, origin = "") => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...(origin && allowedOrigins.has(origin) ? { "access-control-allow-origin": origin, "access-control-allow-credentials": "true", "vary": "Origin" } : {}) } });
const hashKey = (key) => createHash("sha256").update(key, "utf8").digest("hex");
const isValidKey = (key) => typeof key === "string" && /^[A-Za-z0-9_-]{40,120}$/.test(key);
const safeTemplate = (row) => ({ id: row.id, name: row.name, category: row.category, status: row.visibility, updatedAt: row.updated_at, publishedAt: row.published_at, ...row.template_json });
const MAX_BYTES = 65536;
export default { async fetch(request) {
 const origin = request.headers.get("origin") || "";
 if (request.method === "OPTIONS") { if (origin && !allowedOrigins.has(origin)) return new Response(null,{status:403}); return new Response(null,{status:204,headers:{"access-control-allow-origin":origin||"https://yudi8377.github.io","access-control-allow-methods":"GET,POST,PUT,DELETE,OPTIONS","access-control-allow-headers":"content-type,x-workspace-key","access-control-max-age":"86400","vary":"Origin"}}); }
 if (origin && !allowedOrigins.has(origin)) return json({error:"Origin tidak diizinkan."},403);
 const url = new URL(request.url);
 try {
  if (url.pathname === "/" || url.pathname === "/health") return json({ok:true,service:"digital-card-template-library",version:1},200,origin);
  if (!url.pathname.startsWith("/templates")) return json({error:"Endpoint tidak ditemukan."},404,origin);
  const key = request.headers.get("x-workspace-key") || "";
  const ownerHash = isValidKey(key) ? hashKey(key) : null;
  if (request.method === "GET" && url.pathname === "/templates") {
   const pub = await pool.query("SELECT id,name,category,visibility,template_json,updated_at,published_at FROM public.card_template_assets WHERE visibility='published' ORDER BY published_at DESC LIMIT 200");
   let rows = pub.rows;
   if (ownerHash) { const drafts = await pool.query("SELECT id,name,category,visibility,template_json,updated_at,published_at FROM public.card_template_assets WHERE owner_key_hash=$1 AND visibility='draft' ORDER BY updated_at DESC LIMIT 100",[ownerHash]); rows=[...drafts.rows,...rows]; }
   return json({templates:rows.map(safeTemplate),server:true},200,origin);
  }
  if (!ownerHash) return json({error:"Kunci ruang kerja diperlukan untuk menyimpan atau mengelola aset."},401,origin);
  if (request.method === "POST" && url.pathname === "/templates") {
   const raw=await request.text(); if(Buffer.byteLength(raw,"utf8")>MAX_BYTES)return json({error:"Template terlalu besar (maksimum 64 KB)."},413,origin);
   let body; try{body=JSON.parse(raw)}catch{return json({error:"JSON tidak valid."},400,origin)}
   const name=String(body.name||"").trim(),category=String(body.category||"").trim(),visibility=body.status==="published"?"published":"draft",template=body.template&&typeof body.template==="object"&&!Array.isArray(body.template)?body.template:null;
   if(!name||name.length>80||!category||category.length>100||!template||!Array.isArray(template.elements)||template.elements.length>80)return json({error:"Data template tidak valid."},400,origin);
   const count=await pool.query("SELECT count(*)::int AS n FROM public.card_template_assets WHERE owner_key_hash=$1",[ownerHash]); if(count.rows[0].n>=100)return json({error:"Batas 100 aset per ruang kerja tercapai."},429,origin);
   const result=await pool.query("INSERT INTO public.card_template_assets(owner_key_hash,name,category,visibility,template_json,published_at) VALUES($1,$2,$3,$4,$5::jsonb,CASE WHEN $4='published' THEN now() ELSE NULL END) RETURNING id,name,category,visibility,template_json,updated_at,published_at",[ownerHash,name,category,visibility,JSON.stringify(template)]);
   return json({template:safeTemplate(result.rows[0]),server:true},201,origin);
  }
  const match=url.pathname.match(/^\/templates\/([0-9a-f-]{36})$/i);
  if(match&&request.method==="PUT"){
   const raw=await request.text();if(Buffer.byteLength(raw,"utf8")>MAX_BYTES)return json({error:"Template terlalu besar (maksimum 64 KB)."},413,origin);
   let body;try{body=JSON.parse(raw)}catch{return json({error:"JSON tidak valid."},400,origin)}
   const name=String(body.name||"").trim(),category=String(body.category||"").trim(),visibility=body.status==="published"?"published":"draft",template=body.template&&typeof body.template==="object"&&!Array.isArray(body.template)?body.template:null;
   if(!name||name.length>80||!category||category.length>100||!template||!Array.isArray(template.elements)||template.elements.length>80)return json({error:"Data template tidak valid."},400,origin);
   const result=await pool.query("UPDATE public.card_template_assets SET name=$3,category=$4,visibility=$5,template_json=$6::jsonb,updated_at=now(),published_at=CASE WHEN $5='published' THEN coalesce(published_at,now()) ELSE NULL END WHERE id=$1 AND owner_key_hash=$2 RETURNING id,name,category,visibility,template_json,updated_at,published_at",[match[1],ownerHash,name,category,visibility,JSON.stringify(template)]);
   if(!result.rowCount)return json({error:"Template tidak ditemukan atau bukan milik ruang kerja ini."},404,origin);
   return json({template:safeTemplate(result.rows[0]),server:true},200,origin);
  }
  if(match&&request.method==="DELETE"){const result=await pool.query("DELETE FROM public.card_template_assets WHERE id=$1 AND owner_key_hash=$2 RETURNING id",[match[1],ownerHash]);if(!result.rowCount)return json({error:"Template tidak ditemukan atau bukan milik ruang kerja ini."},404,origin);return json({deleted:true,id:match[1],server:true},200,origin)}
  return json({error:"Metode atau endpoint tidak didukung."},405,origin);
 }catch(error){console.error("[card-template-api]",error?.message||"unknown error");return json({error:"Layanan template sementara tidak dapat memproses permintaan. Coba lagi nanti."},503,origin)}
}};
