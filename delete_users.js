/**
 * Script to delete all non-admin users from the database.
 * Keeps only the admin account with phone number: 0567409089
 *
 * Uses the 'pg' package to connect directly to PostgreSQL.
 * Usage: node delete_users.js
 */

const { Client } = require('pg');

const ADMIN_PHONE = '0567409089';
const DATABASE_URL = 'postgresql://postgres.rofuprupbovxhuvbasjp:Shadi258789%40@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log('✅ Connected to database.\n');

  try {
    // Find the admin user
    const adminRes = await client.query(
      'SELECT id, name, phone, role FROM users WHERE phone = $1 LIMIT 1',
      [ADMIN_PHONE]
    );

    if (adminRes.rows.length === 0) {
      console.log(`⚠️  Warning: Admin user with phone ${ADMIN_PHONE} not found!`);
      console.log('Aborting to avoid deleting all users including admin.');
      return;
    }

    const admin = adminRes.rows[0];
    console.log('✅ Admin user found:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Phone: ${admin.phone}`);
    console.log(`   Role: ${admin.role}`);
    console.log('');

    // List users to be deleted
    const listRes = await client.query(
      'SELECT id, name, phone, email, role FROM users WHERE id != $1',
      [admin.id]
    );

    console.log(`📋 Found ${listRes.rows.length} users to delete:`);
    listRes.rows.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.name || '(no name)'} | phone: ${u.phone || '-'} | email: ${u.email || '-'} | role: ${u.role}`);
    });
    console.log('');

    if (listRes.rows.length === 0) {
      console.log('✅ No users to delete. Database is already clean.');
      return;
    }

    // Delete all users except admin
    // ON DELETE CASCADE in schema handles: accounts, sessions, addresses, auditLogs, conversations
    // ON DELETE SET NULL handles: carts, orders, customer (userId => null)
    const deleteRes = await client.query(
      'DELETE FROM users WHERE id != $1',
      [admin.id]
    );

    console.log(`🗑️  Successfully deleted ${deleteRes.rowCount} users.`);
    console.log(`✅ Admin user (${ADMIN_PHONE}) is preserved.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
