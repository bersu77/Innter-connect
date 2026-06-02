import 'dotenv/config';
import mongoose from 'mongoose';

// Import every model so it registers on the connection.
import User from '../models/User.js';
import Application from '../models/Application.js';
import InternshipListing from '../models/InternshipListing.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

const models = { User, Application, InternshipListing, Notification, AuditLog };

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('✗ MONGO_URI is not set. Add it to server/.env first.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✓ Connected to MongoDB: ${conn.connection.host} (db: ${conn.connection.name})`);

    for (const [name, Model] of Object.entries(models)) {
      // syncIndexes() creates the collection if missing, builds any missing
      // indexes, and drops indexes that are no longer defined in the schema.
      const dropped = await Model.syncIndexes();
      const indexes = await Model.collection.indexes();
      console.log(
        `✓ ${name}: ${indexes.length} index(es) in sync` +
          (dropped.length ? ` (dropped: ${dropped.join(', ')})` : '')
      );
    }

    console.log('\n✓ All schemas deployed to the remote database.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`✗ Schema sync failed: ${err.message}`);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

run();
