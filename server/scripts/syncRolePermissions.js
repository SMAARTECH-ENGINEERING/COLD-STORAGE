require('dotenv').config();

const mongoose = require('mongoose');
const Role = require('../src/models/Role');
const { ROLE_PERMISSIONS } = require('../src/utils/constants');

const MONGODB_URI = process.env.NODE_ENV === 'production'
  ? process.env.MONGODB_URI_PROD
  : process.env.MONGODB_URI;

// Non-destructive: updates only the permissions array of the 4 built-in
// roles to match utils/constants.js, without touching users/devices/etc.
const sync = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    for (const [name, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const result = await Role.updateOne({ name }, { $set: { permissions } });
      if (result.matchedCount > 0) {
        console.log(`✓ Synced permissions for role '${name}'`);
      } else {
        console.log(`- Skipped '${name}' (role not found in DB)`);
      }
    }
  } catch (err) {
    console.error(`✗ Sync failed: ${err.message}`);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');
    process.exit(0);
  }
};

sync();
