require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const Role = require('../src/models/Role');
const { ROLE_PERMISSIONS } = require('../src/utils/constants');

const MONGODB_URI = process.env.NODE_ENV === 'production'
  ? process.env.MONGODB_URI_PROD
  : process.env.MONGODB_URI;

const run = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  const roleNames = Object.keys(ROLE_PERMISSIONS);

  for (const roleName of roleNames) {
    const result = await Role.findOneAndUpdate(
      { name: roleName },
      { $set: { permissions: ROLE_PERMISSIONS[roleName] } },
      { new: true }
    );
    if (result) {
      console.log(`✓ Updated permissions for role: ${roleName} (${result.permissions.length} resources)`);
    } else {
      console.log(`⚠ Role not found in DB: ${roleName}`);
    }
  }

  console.log('\n✓ All roles updated. Users must re-login to see updated permissions.\n');
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('✗ Failed:', err.message);
  process.exit(1);
});
