const REQUIRED_VARS = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'] as const;
const OPTIONAL_VARS = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] as const;

export type EnvVar = (typeof REQUIRED_VARS)[number] | (typeof OPTIONAL_VARS)[number];

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const v of REQUIRED_VARS) {
    if (!process.env[v] || process.env[v].trim() === '') {
      missing.push(v);
    }
  }

  for (const v of OPTIONAL_VARS) {
    if (!process.env[v] || process.env[v].trim() === '') {
      warnings.push(`${v} is not set — associated features will be disabled`);
    }
  }

  if (process.env.NEXTAUTH_URL) {
    try {
      new URL(process.env.NEXTAUTH_URL);
    } catch {
      warnings.push('NEXTAUTH_URL is not a valid URL');
    }
  }

  if (process.env.DATABASE_URL) {
    if (
      !process.env.DATABASE_URL.startsWith('postgresql://') &&
      !process.env.DATABASE_URL.startsWith('postgres://')
    ) {
      warnings.push('DATABASE_URL should be a PostgreSQL connection string');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

export function getEnvOrThrow(key: EnvVar): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
