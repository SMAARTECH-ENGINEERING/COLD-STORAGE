require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Role = require('../src/models/Role');
const User = require('../src/models/User');
const Device = require('../src/models/Device');
const Vegetable = require('../src/models/Vegetable');
const { ROLE_PERMISSIONS } = require('../src/utils/constants');

const hashPassword = async (password) => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

const MONGODB_URI = process.env.NODE_ENV === 'production'
  ? process.env.MONGODB_URI_PROD
  : process.env.MONGODB_URI;

// ─── Seed Data ────────────────────────────────────────────────────────────────

const rolesData = [
  { name: 'super_admin', displayName: 'Super Administrator', description: 'Full system access', permissions: ROLE_PERMISSIONS.super_admin },
  { name: 'admin', displayName: 'Administrator', description: 'Manage users, devices, and vegetables', permissions: ROLE_PERMISSIONS.admin },
  { name: 'operator', displayName: 'Operator', description: 'Operate devices and manage sensor data', permissions: ROLE_PERMISSIONS.operator },
  { name: 'viewer', displayName: 'Viewer', description: 'Read-only access to data', permissions: ROLE_PERMISSIONS.viewer },
];

const vegetablesData = [
  {
    name: 'Potato',
    description: 'Common potato requiring cool, dark storage',
    temperature: { min: 2, max: 8 },
    humidity: { min: 85, max: 95 },
    storageDurationDays: 90,
  },
  {
    name: 'Onion',
    description: 'Dry onion storage with low humidity',
    temperature: { min: 0, max: 5 },
    humidity: { min: 65, max: 75 },
    storageDurationDays: 180,
  },
  {
    name: 'Tomato',
    description: 'Ripe tomato cold storage',
    temperature: { min: 8, max: 12 },
    humidity: { min: 85, max: 95 },
    storageDurationDays: 14,
  },
  {
    name: 'Carrot',
    description: 'Fresh carrot near-freezing storage',
    temperature: { min: 0, max: 4 },
    humidity: { min: 90, max: 98 },
    storageDurationDays: 120,
  },
  {
    name: 'Cabbage',
    description: 'Head cabbage refrigerated storage',
    temperature: { min: 0, max: 2 },
    humidity: { min: 95, max: 100 },
    storageDurationDays: 60,
  },
  {
    name: 'Cauliflower',
    description: 'Fresh cauliflower cold storage',
    temperature: { min: 0, max: 4 },
    humidity: { min: 90, max: 95 },
    storageDurationDays: 21,
  },
];

const devicesData = [
  { deviceId: 'CS001', name: 'Storage Unit A', location: 'Warehouse Block 1 - North', description: 'Primary potato storage unit' },
  { deviceId: 'CS002', name: 'Storage Unit B', location: 'Warehouse Block 1 - South', description: 'Onion and garlic storage' },
  { deviceId: 'CS003', name: 'Storage Unit C', location: 'Warehouse Block 2 - East', description: 'Tomato ripening room' },
  { deviceId: 'CS004', name: 'Storage Unit D', location: 'Warehouse Block 2 - West', description: 'Root vegetable storage' },
  { deviceId: 'CS005', name: 'Storage Unit E', location: 'Warehouse Block 3', description: 'Leafy vegetables cold room' },
];

// ─── Seed Function ────────────────────────────────────────────────────────────

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear collections
    await Promise.all([
      Role.deleteMany({}),
      User.deleteMany({}),
      Device.deleteMany({}),
      Vegetable.deleteMany({}),
    ]);
    console.log('✓ Cleared existing data');

    // Seed roles
    const roles = await Role.insertMany(rolesData);
    const roleMap = {};
    roles.forEach((r) => { roleMap[r.name] = r._id; });
    console.log(`✓ Seeded ${roles.length} roles`);

    // Seed vegetables
    const vegetables = await Vegetable.insertMany(vegetablesData);
    const vegMap = {};
    vegetables.forEach((v) => { vegMap[v.name] = v._id; });
    console.log(`✓ Seeded ${vegetables.length} vegetables`);

    // Seed devices with assigned vegetables
    const deviceDataWithVeg = devicesData.map((d, i) => ({
      ...d,
      assignedVegetable: vegetables[i % vegetables.length]._id,
    }));
    const devices = await Device.insertMany(deviceDataWithVeg);
    console.log(`✓ Seeded ${devices.length} devices`);

    // Seed users
    const usersData = [
      {
        name: 'Super Administrator',
        email: process.env.SEED_ADMIN_EMAIL || 'superadmin@coldstorage.com',
        password: process.env.SEED_ADMIN_PASSWORD || 'Admin@1234',
        role: roleMap['super_admin'],
        phone: '+91 9000000001',
      },
      {
        name: 'Warehouse Admin',
        email: 'admin@coldstorage.com',
        password: 'Admin@1234',
        role: roleMap['admin'],
        phone: '+91 9000000002',
      },
      {
        name: 'Cold Room Operator',
        email: 'operator@coldstorage.com',
        password: 'Operator@1234',
        role: roleMap['operator'],
        phone: '+91 9000000003',
        assignedDevices: [devices[0]._id, devices[1]._id],
      },
      {
        name: 'Monitoring Viewer',
        email: 'viewer@coldstorage.com',
        password: 'Viewer@1234',
        role: roleMap['viewer'],
        phone: '+91 9000000004',
      },
    ];

    for (const userData of usersData) {
      userData.password = await hashPassword(userData.password);
    }

    const users = await User.insertMany(usersData);
    console.log(`✓ Seeded ${users.length} users`);

    console.log('\n' + '═'.repeat(60));
    console.log('  SEED COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(60));
    console.log('\n  Login Credentials:');
    console.log('  ┌─────────────┬─────────────────────────────────────┬──────────────────┐');
    console.log('  │ Role        │ Email                               │ Password         │');
    console.log('  ├─────────────┼─────────────────────────────────────┼──────────────────┤');
    console.log(`  │ Super Admin │ ${(process.env.SEED_ADMIN_EMAIL || 'superadmin@coldstorage.com').padEnd(35)} │ Admin@1234       │`);
    console.log('  │ Admin       │ admin@coldstorage.com               │ Admin@1234       │');
    console.log('  │ Operator    │ operator@coldstorage.com            │ Operator@1234    │');
    console.log('  │ Viewer      │ viewer@coldstorage.com              │ Viewer@1234      │');
    console.log('  └─────────────┴─────────────────────────────────────┴──────────────────┘\n');

  } catch (err) {
    console.error(`✗ Seed failed: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');
    process.exit(0);
  }
};

seed();
