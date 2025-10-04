const mongoose = require('mongoose');
const User = require('../models/userModel');
const { createSupabaseUser, sendPasswordResetEmail } = require('../config/supabaseConfig');
require('dotenv').config();

/**
 * Migration Script: Migrate existing JWT users to Supabase
 * 
 * This script:
 * 1. Finds all users without Supabase ID
 * 2. Creates corresponding Supabase accounts
 * 3. Links Supabase ID to MongoDB user
 * 4. Sends password reset email to users
 * 
 * Usage: node scripts/migrateUsersToSupabase.js
 */

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set to true to test without making changes
const BATCH_SIZE = 10; // Process users in batches
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds delay to avoid rate limiting

// Helper to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a secure temporary password
const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Migrate a single user
async function migrateUser(user) {
  try {
    // Generate temporary password
    const tempPassword = generateTempPassword();

    console.log(`  Processing: ${user.email}`);

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would create Supabase user for: ${user.email}`);
      return { success: true, email: user.email, dryRun: true };
    }

    // Create user in Supabase
    const supabaseUser = await createSupabaseUser(
      user.email,
      tempPassword,
      {
        name: user.name,
        contactNumber: user.contactNumber,
        role: user.role,
        migrated: true,
        migratedAt: new Date().toISOString()
      }
    );

    // Update MongoDB user
    user.supabaseId = supabaseUser.id;
    user.authMethod = 'supabase';
    user.password = undefined; // Remove old password hash (optional)
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email);
      console.log(`  ✅ Migrated and sent reset email: ${user.email}`);
    } catch (emailError) {
      console.log(`  ⚠️  Migrated but failed to send email: ${user.email}`);
      console.log(`     Email error: ${emailError.message}`);
    }

    return { 
      success: true, 
      email: user.email, 
      supabaseId: supabaseUser.id 
    };

  } catch (error) {
    console.error(`  ❌ Failed: ${user.email} - ${error.message}`);
    return { 
      success: false, 
      email: user.email, 
      error: error.message 
    };
  }
}

// Main migration function
async function migrateUsers() {
  console.log('='.repeat(60));
  console.log('User Migration Script: JWT to Supabase');
  console.log('='.repeat(60));
  console.log();

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made');
    console.log('   Set DRY_RUN=false to perform actual migration');
    console.log();
  }

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log();

    // Find users to migrate
    const query = {
      $or: [
        { supabaseId: { $exists: false } },
        { supabaseId: null },
        { supabaseId: '' }
      ],
      authMethod: { $ne: 'supabase' }
    };

    const totalUsers = await User.countDocuments(query);
    console.log(`Found ${totalUsers} users to migrate`);
    console.log();

    if (totalUsers === 0) {
      console.log('No users to migrate. Exiting...');
      await mongoose.disconnect();
      return;
    }

    // Confirm migration
    if (!DRY_RUN) {
      console.log('⚠️  WARNING: This will migrate all users to Supabase');
      console.log('   Users will need to reset their passwords');
      console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      console.log();
      await delay(5000);
    }

    // Process users in batches
    const results = {
      total: totalUsers,
      successful: 0,
      failed: 0,
      errors: []
    };

    let processed = 0;
    let batch = 1;

    while (processed < totalUsers) {
      console.log(`-`.repeat(60));
      console.log(`Batch ${batch} (${processed + 1}-${Math.min(processed + BATCH_SIZE, totalUsers)} of ${totalUsers})`);
      console.log(`-`.repeat(60));

      const users = await User.find(query)
        .limit(BATCH_SIZE)
        .skip(processed);

      for (const user of users) {
        const result = await migrateUser(user);
        
        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({
            email: result.email,
            error: result.error
          });
        }

        processed++;
      }

      batch++;

      // Delay between batches to avoid rate limiting
      if (processed < totalUsers) {
        console.log();
        console.log(`  Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await delay(DELAY_BETWEEN_BATCHES);
        console.log();
      }
    }

    // Print summary
    console.log();
    console.log('='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total users:      ${results.total}`);
    console.log(`Successful:       ${results.successful} ✅`);
    console.log(`Failed:           ${results.failed} ❌`);
    console.log();

    if (results.errors.length > 0) {
      console.log('Failed migrations:');
      results.errors.forEach(({ email, error }) => {
        console.log(`  - ${email}: ${error}`);
      });
      console.log();
    }

    if (DRY_RUN) {
      console.log('⚠️  DRY RUN completed - No actual changes were made');
    } else {
      console.log('✅ Migration completed successfully');
      console.log();
      console.log('Next steps:');
      console.log('1. Verify users in Supabase dashboard');
      console.log('2. Check MongoDB for updated supabaseId fields');
      console.log('3. Notify users to check their email for password reset');
      console.log('4. Monitor login attempts and provide support as needed');
    }

    console.log('='.repeat(60));

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Migration error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateUsers()
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateUsers, migrateUser };
