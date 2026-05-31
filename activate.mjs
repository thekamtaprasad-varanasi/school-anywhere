// activate.mjs
import { createClient } from '@libsql/client';
const client = createClient({
  url: 'libsql://dental-generic-kamtatiwari.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ1NDA2MzAsImlkIjoiMDE5ZDJhZGMtMTgwMS03MmM4LWI0MjktOGFmODc0YWYzYzhmIiwicmlkIjoiY2I3ZWM0NzEtZDJjNC00Nzc2LTgyNDctMWZkMTczMWQwOTIwIn0.g82KlDX0URN_MK97idhteTyKLyDeaX0yCYyffoyYMcU47zFrWAkt6X3CaAn8jj1oAXt8sKneqvftP4PPWIqOCw'
});
const r = await client.execute('SELECT id, name, email, active FROM clinics');
console.log(r.rows);