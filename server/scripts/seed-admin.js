const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const supabase = require('../src/config/supabase');

async function seedAdmin() {
  const adminEmail = 'laindaininterns@gmail.com';
  const adminPassword = 'interns@LAINDAIN';
  const adminRole = 'ADMIN';

  console.log('----------------------------------------------------');
  console.log(`🛡️  Admin Account Provisioning: ${adminEmail}`);
  console.log('----------------------------------------------------');

  try {
    // Generate bcrypt hash
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(adminPassword, salt);

    // Check if user already exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, email, role, is_email_verified')
      .ilike('email', adminEmail)
      .maybeSingle();

    if (findError) {
      throw new Error(`Database lookup error: ${findError.message}`);
    }

    let userId;

    if (existingUser) {
      console.log(`ℹ️  Found existing user with ID: ${existingUser.id} (Current Role: ${existingUser.role})`);
      console.log(`🔄 Updating credentials, role to ADMIN, and email verification status...`);

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          password_hash,
          role: adminRole,
          is_email_verified: true,
          email_verification_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select('id, email, role, is_email_verified, updated_at')
        .single();

      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`);
      }

      userId = updatedUser.id;
      console.log(`✅ User successfully updated:`, updatedUser);
    } else {
      console.log(`➕ User does not exist. Creating new ADMIN user account...`);

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email: adminEmail.toLowerCase(),
            password_hash,
            role: adminRole,
            is_email_verified: true,
            email_verification_token: null,
          },
        ])
        .select('id, email, role, is_email_verified, created_at')
        .single();

      if (insertError) {
        throw new Error(`Failed to create admin user: ${insertError.message}`);
      }

      userId = newUser.id;
      console.log(`✅ Admin user created:`, newUser);
    }

    // Ensure corresponding admin_profiles record exists
    const { data: existingProfile, error: profLookupError } = await supabase
      .from('admin_profiles')
      .select('id, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profLookupError) {
      console.warn('⚠️ Admin profile lookup warning:', profLookupError.message);
    }

    if (!existingProfile) {
      console.log(`➕ Creating admin profile record for user ${userId}...`);
      const { data: newProfile, error: profInsertError } = await supabase
        .from('admin_profiles')
        .insert([{ user_id: userId }])
        .select('*')
        .single();

      if (profInsertError) {
        throw new Error(`Failed to create admin profile: ${profInsertError.message}`);
      }
      console.log(`✅ Admin profile created with ID: ${newProfile.id}`);
    } else {
      console.log(`✅ Verified existing admin profile with ID: ${existingProfile.id}`);
    }

    // Verify bcrypt hash comparison
    const isValid = await bcrypt.compare(adminPassword, password_hash);
    console.log(`🔐 Bcrypt password validation check: ${isValid ? 'PASSED ✅' : 'FAILED ❌'}`);

    console.log('----------------------------------------------------');
    console.log(`🎉 Admin User Provisioning Complete:`);
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     ${adminRole}`);
    console.log(`   Verified: true`);
    console.log('----------------------------------------------------');
    return { success: true, userId, email: adminEmail };
  } catch (error) {
    console.error(`❌ Provisioning Failed:`, error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedAdmin().then(() => process.exit(0));
}

module.exports = seedAdmin;
