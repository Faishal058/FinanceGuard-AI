const { createClient } = require('@libsql/client');
const db = createClient({
  url: 'libsql://financeguard-db-faishal058.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODM3Mjk5NzUsImlkIjoiMDE5ZjRlOTMtZjUwMS03NmU2LWJkOWQtNzdiOTRmOTgwNWFiIiwia2lkIjoiOVBzRWRlQ3c2S2E4bUc0MVdYMERvWlJHaGFhcTNhLWxzT2ZjYUpXXzZzOCIsInJpZCI6IjdlNjFlYTUxLWEzNTktNGY1ZC1hZDBmLTU1ZDgzM2E1ZTZlMiJ9.N3okFjiP3rw52w6J3DQ2A50FoqpKu-V44Foi7kLjHkrbGAIoGipvfmrNre7-40p6aii6JO-eXBPXrcxCFBkKDw'
});

async function main() {
  try {
    const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('=== TABLES ===');
    console.log(tables.rows.map(r => r.name).join(', '));

    const users = await db.execute('SELECT user_id, email FROM user_auth LIMIT 10');
    console.log('\n=== USERS ===');
    console.log(JSON.stringify(users.rows, null, 2));

    const docs = await db.execute('SELECT id, user_id, name, status FROM documents_metadata LIMIT 10');
    console.log('\n=== DOCUMENTS ===');
    console.log(JSON.stringify(docs.rows, null, 2));

    const profiles = await db.execute('SELECT user_id, email, net_worth, monthly_gross FROM user_profiles LIMIT 10');
    console.log('\n=== USER PROFILES ===');
    console.log(JSON.stringify(profiles.rows, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
