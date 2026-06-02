import 'dotenv/config';
import mongoose from 'mongoose';

import User from '../models/User.js';
import Application from '../models/Application.js';

// Models that have custom (non-_id) indexes to build.
const models = { User, Application };

const getThreshold = async (admin) => {
  const res = await admin.command({ getParameter: 1, indexBuildMinAvailableDiskSpaceMB: 1 });
  return res.indexBuildMinAvailableDiskSpaceMB;
};

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('✗ MONGO_URI not set.');
    process.exit(1);
  }

  const conn = await mongoose.connect(uri);
  const admin = conn.connection.db.admin();
  console.log(`✓ Connected: ${conn.connection.host} (db: ${conn.connection.name})`);

  let original = null;
  let restored = false;
  try {
    original = await getThreshold(admin);
    console.log(`• Current indexBuildMinAvailableDiskSpaceMB = ${original}`);

    await admin.command({ setParameter: 1, indexBuildMinAvailableDiskSpaceMB: 100 });
    console.log('• Temporarily lowered threshold to 100 MB');

    for (const [name, Model] of Object.entries(models)) {
      await Model.syncIndexes();
      const ix = await Model.collection.indexes();
      console.log(`✓ ${name}: ${ix.map((i) => i.name).join(', ')}`);
    }
  } catch (err) {
    console.error(`✗ Build failed: ${err.message}`);
  } finally {
    // Always try to restore the original safety threshold.
    if (original !== null) {
      try {
        await admin.command({ setParameter: 1, indexBuildMinAvailableDiskSpaceMB: original });
        const now = await getThreshold(admin);
        restored = now === original;
        console.log(`• Restored threshold to ${now} MB`);
      } catch (e) {
        console.error(`✗ Could not restore threshold: ${e.message}`);
      }
    }
    await mongoose.disconnect();
    process.exit(restored ? 0 : 1);
  }
};

run();
