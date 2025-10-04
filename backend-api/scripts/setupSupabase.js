const readline = require('readline');
const fs = require('fs');
const path = require('path');

/**
 * Interactive setup script for Supabase configuration
 * Helps configure environment variables for Supabase integration
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}\n`)
};

async function setup() {
  console.clear();
  log.title('🚀 Supabase Configuration Setup');
  
  console.log('This script will help you configure Supabase for BuFood.\n');
  log.info('You will need:');
  console.log('  1. Supabase Project URL');
  console.log('  2. Supabase Anon Key');
  console.log('  3. Supabase Service Role Key');
  console.log('  4. MongoDB Connection String\n');

  const proceed = await question('Do you want to continue? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    log.warning('Setup cancelled');
    rl.close();
    return;
  }

  console.log('\n' + '='.repeat(60));
  log.title('Step 1: Supabase Configuration');
  
  log.info('Get these from: https://app.supabase.com → Your Project → Settings → API');
  console.log();

  const supabaseUrl = await question('Enter Supabase Project URL: ');
  const supabaseAnonKey = await question('Enter Supabase Anon Key: ');
  const supabaseServiceKey = await question('Enter Supabase Service Role Key: ');

  console.log('\n' + '='.repeat(60));
  log.title('Step 2: MongoDB Configuration');
  
  log.info('Get this from: https://cloud.mongodb.com → Your Cluster → Connect');
  console.log();

  const mongoUri = await question('Enter MongoDB Connection String: ');

  console.log('\n' + '='.repeat(60));
  log.title('Step 3: Server Configuration');
  console.log();

  const port = await question('Enter server port (default: 8000): ') || '8000';
  const frontendUrl = await question('Enter frontend URL (default: http://localhost:5173): ') || 'http://localhost:5173';

  console.log('\n' + '='.repeat(60));
  log.title('Step 4: JWT Secrets (for backward compatibility)');
  console.log();

  log.info('Generating random JWT secrets...');
  const jwtSecret = generateSecret();
  const refreshSecret = generateSecret();
  log.success('Secrets generated');

  // Validate inputs
  console.log('\n' + '='.repeat(60));
  log.title('Validating Configuration');

  const errors = [];

  if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
    errors.push('Invalid Supabase URL');
  }

  if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
    errors.push('Invalid Supabase Anon Key');
  }

  if (!supabaseServiceKey || supabaseServiceKey.length < 20) {
    errors.push('Invalid Supabase Service Role Key');
  }

  if (!mongoUri || !mongoUri.includes('mongodb')) {
    errors.push('Invalid MongoDB URI');
  }

  if (errors.length > 0) {
    log.error('Validation failed:');
    errors.forEach(err => console.log(`  - ${err}`));
    rl.close();
    return;
  }

  log.success('Configuration validated');

  // Create .env content
  const envContent = `# Server Configuration
PORT=${port}
NODE_ENV=development
BASE_URL=http://localhost:${port}
FRONTEND_URL=${frontendUrl}

# MongoDB Configuration
MONGODB_URI=${mongoUri}

# JWT Secrets (for legacy authentication - backward compatibility)
JWT_SECRET=${jwtSecret}
REFRESH_TOKEN_SECRET=${refreshSecret}

# Supabase Configuration (Primary Authentication)
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# Email Configuration (Optional - Supabase handles email by default)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=BuFood <no-reply@bufood.com>

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Redis Configuration (Optional)
USE_REDIS=false
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Debug Options
MAIL_DEBUG=false
EXPOSE_VERIFY_LINK_FOR_TESTING=false
EXPOSE_OTP_FOR_TESTING=false
`;

  // Save .env file
  console.log('\n' + '='.repeat(60));
  log.title('Step 5: Saving Configuration');

  const envPath = path.join(__dirname, '..', '.env');
  const envExists = fs.existsSync(envPath);

  if (envExists) {
    log.warning('.env file already exists');
    const overwrite = await question('Do you want to overwrite it? (y/n): ');
    
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Saving as .env.new instead');
      fs.writeFileSync(path.join(__dirname, '..', '.env.new'), envContent);
      log.success('Configuration saved to .env.new');
      console.log('\nRename .env.new to .env to use the new configuration');
    } else {
      // Backup existing .env
      const backupPath = path.join(__dirname, '..', `.env.backup.${Date.now()}`);
      fs.copyFileSync(envPath, backupPath);
      log.info(`Existing .env backed up to ${path.basename(backupPath)}`);
      
      fs.writeFileSync(envPath, envContent);
      log.success('Configuration saved to .env');
    }
  } else {
    fs.writeFileSync(envPath, envContent);
    log.success('Configuration saved to .env');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log.title('✅ Setup Complete!');

  console.log('\nNext steps:');
  console.log('  1. Review the .env file and add any missing values');
  console.log('  2. Configure Supabase email templates (see SUPABASE_SETUP.md)');
  console.log('  3. Set up frontend .env file (see frontend/ENV_TEMPLATE.md)');
  console.log('  4. Run: npm install');
  console.log('  5. Run: npm run dev');
  console.log('\nFor detailed instructions, see:');
  console.log('  - SUPABASE_SETUP.md');
  console.log('  - SUPABASE_INTEGRATION_README.md');
  console.log('  - MIGRATION_GUIDE.md\n');

  rl.close();
}

function generateSecret(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// Run setup
setup().catch(err => {
  log.error('Setup failed: ' + err.message);
  console.error(err);
  rl.close();
  process.exit(1);
});
