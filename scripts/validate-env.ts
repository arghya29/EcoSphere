import { validateEnvironment } from '../lib/env';

function main() {
  console.log('Validating environment variables...\n');

  const result = validateEnvironment();

  if (result.missing.length > 0) {
    console.error(' Missing required variables:');
    for (const v of result.missing) {
      console.error(`   - ${v}`);
    }
    console.error('\nSet these in your .env file or environment before proceeding.\n');
  }

  if (result.warnings.length > 0) {
    console.log(' Warnings:');
    for (const w of result.warnings) {
      console.log(`   - ${w}`);
    }
    console.log();
  }

  if (result.valid) {
    console.log(' All required environment variables are set.');
    if (result.warnings.length > 0) {
      console.log('Some optional variables are missing — see warnings above.');
    } else {
      console.log('All optional variables are configured.');
    }
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();
