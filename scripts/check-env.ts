/**
 * Environment Variables Validation Script
 * 
 * Checks if required environment variables are set before production deployment.
 * 
 * Usage:
 * npx ts-node scripts/check-env.ts
 * or
 * npm run check-env
 * 
 * Environment variables:
 * - SKIP_ENV_VALIDATION: Set to "true" to skip validation (for CI/CD builds)
 * - CI: If set, will use softer exit (warning instead of error)
 */

// Skip validation in CI environment or when explicitly requested
if (process.env.SKIP_ENV_VALIDATION === "true") {
  console.log("\n[ENV CHECK] Skipped (SKIP_ENV_VALIDATION=true)\n");
  process.exit(0);
}

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  example?: string;
  validate?: (value: string) => boolean;
}

// Environment variable definitions
const envVars: EnvVar[] = [
  // === NextAuth ===
  {
    name: "NEXTAUTH_SECRET",
    required: true,
    description: "NextAuth session encryption key (min 32 chars)",
    example: "openssl rand -base64 32",
    validate: (v) => v.length >= 32,
  },
  {
    name: "NEXTAUTH_URL",
    required: true,
    description: "App base URL",
    example: "https://yourdomain.com",
    validate: (v) => v.startsWith("http://") || v.startsWith("https://"),
  },

  // === Database ===
  {
    name: "DATABASE_URL",
    required: true,
    description: "PostgreSQL connection string (Supabase/Neon etc)",
    example: "postgresql://user:password@host:5432/dbname",
    validate: (v) => v.startsWith("postgresql://") || v.startsWith("postgres://"),
  },

  // === GitHub OAuth ===
  {
    name: "GITHUB_ID",
    required: true,
    description: "GitHub OAuth Client ID",
  },
  {
    name: "GITHUB_SECRET",
    required: true,
    description: "GitHub OAuth Client Secret",
  },

  // === Supabase Storage ===
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    description: "Supabase Project URL",
    example: "https://xxxxx.supabase.co",
    validate: (v) => v.includes("supabase.co"),
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    description: "Supabase Anonymous Key (public)",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    description: "Supabase Service Role Key (private, server only)",
  },

  // === Stripe Payment ===
  {
    name: "STRIPE_SECRET_KEY",
    required: true,
    description: "Stripe Secret Key",
    example: "sk_test_xxxxx or sk_live_xxxxx",
    validate: (v) => v.startsWith("sk_test_") || v.startsWith("sk_live_"),
  },
  {
    name: "STRIPE_WEBHOOK_SECRET",
    required: true,
    description: "Stripe Webhook Secret",
    example: "whsec_xxxxx",
    validate: (v) => v.startsWith("whsec_"),
  },
  {
    name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    required: false,
    description: "Stripe Publishable Key (client)",
    example: "pk_test_xxxxx",
  },

  // === Resend Email ===
  {
    name: "RESEND_API_KEY",
    required: true,
    description: "Resend API Key",
    example: "re_xxxxx",
    validate: (v) => v.startsWith("re_"),
  },
  {
    name: "FROM_EMAIL",
    required: false,
    description: "Sender email address",
    example: "noreply@yourdomain.com",
    validate: (v) => v.includes("@"),
  },

  // === Sentry Monitoring ===
  {
    name: "NEXT_PUBLIC_SENTRY_DSN",
    required: false,
    description: "Sentry DSN (error monitoring)",
    example: "https://xxxxx@xxxxx.ingest.sentry.io/xxxxx",
    validate: (v) => v.includes("sentry.io"),
  },
  {
    name: "SENTRY_ORG",
    required: false,
    description: "Sentry org name (for sourcemap upload)",
  },
  {
    name: "SENTRY_PROJECT",
    required: false,
    description: "Sentry project name (for sourcemap upload)",
  },
  {
    name: "SENTRY_AUTH_TOKEN",
    required: false,
    description: "Sentry auth token (for sourcemap upload)",
  },

  // === Internal API ===
  {
    name: "INTERNAL_API_KEY",
    required: false,
    description: "Internal service-to-service API key",
    example: "Generate random: openssl rand -hex 32",
  },

  // === App URL ===
  {
    name: "NEXT_PUBLIC_APP_URL",
    required: false,
    description: "App public URL (for SEO)",
    example: "https://yourdomain.com",
  },

  // === AI Chatbot - Anthropic ===
  {
    name: "ANTHROPIC_API_KEY",
    required: false,
    description: "Anthropic Claude API Key (for AI chatbot)",
    example: "sk-ant-xxxxx",
    validate: (v) => v.startsWith("sk-ant-"),
  },
];

// Color codes
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function checkEnvVars(): void {
  console.log(`\n${colors.bold}${colors.cyan}[ENV CHECK] Starting validation...${colors.reset}\n`);
  
  const missing: EnvVar[] = [];
  const invalid: { envVar: EnvVar; value: string }[] = [];
  const optional: EnvVar[] = [];
  const valid: EnvVar[] = [];

  for (const envVar of envVars) {
    const value = process.env[envVar.name];

    if (!value || value.trim() === "") {
      if (envVar.required) {
        missing.push(envVar);
      } else {
        optional.push(envVar);
      }
      continue;
    }

    if (envVar.validate && !envVar.validate(value)) {
      invalid.push({ envVar, value });
      continue;
    }

    valid.push(envVar);
  }

  // Output results
  console.log(`${colors.bold}[RESULTS]${colors.reset}\n`);

  // Valid variables
  if (valid.length > 0) {
    console.log(`${colors.green}[OK] Set (${valid.length})${colors.reset}`);
    for (const envVar of valid) {
      const value = process.env[envVar.name]!;
      const masked = maskValue(envVar.name, value);
      console.log(`   ${colors.green}*${colors.reset} ${envVar.name}: ${masked}`);
    }
    console.log();
  }

  // Missing required variables
  if (missing.length > 0) {
    console.log(`${colors.red}[MISSING] Required (${missing.length})${colors.reset}`);
    for (const envVar of missing) {
      console.log(`   ${colors.red}*${colors.reset} ${envVar.name}`);
      console.log(`     ${colors.cyan}Desc:${colors.reset} ${envVar.description}`);
      if (envVar.example) {
        console.log(`     ${colors.cyan}Example:${colors.reset} ${envVar.example}`);
      }
    }
    console.log();
  }

  // Invalid format
  if (invalid.length > 0) {
    console.log(`${colors.yellow}[INVALID] Format error (${invalid.length})${colors.reset}`);
    for (const { envVar, value } of invalid) {
      const masked = maskValue(envVar.name, value);
      console.log(`   ${colors.yellow}*${colors.reset} ${envVar.name}: ${masked}`);
      console.log(`     ${colors.cyan}Desc:${colors.reset} ${envVar.description}`);
      if (envVar.example) {
        console.log(`     ${colors.cyan}Example:${colors.reset} ${envVar.example}`);
      }
    }
    console.log();
  }

  // Optional (not set)
  if (optional.length > 0) {
    console.log(`${colors.blue}[INFO] Optional - not set (${optional.length})${colors.reset}`);
    for (const envVar of optional) {
      console.log(`   ${colors.blue}*${colors.reset} ${envVar.name}: ${envVar.description}`);
    }
    console.log();
  }

  // Final result
  console.log(`${colors.bold}========================================${colors.reset}`);
  
  if (missing.length > 0 || invalid.length > 0) {
    console.log(`${colors.red}${colors.bold}[FAIL] Validation failed${colors.reset}`);
    console.log(`   Required: ${missing.length} missing, ${invalid.length} invalid format`);
    console.log(`\n${colors.yellow}Tip: Check .env.example and configure .env.local${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}[PASS] Validation successful${colors.reset}`);
    console.log(`   All required environment variables are set.`);
    
    if (optional.length > 0) {
      console.log(`\n${colors.yellow}Note: ${optional.length} optional variables are not set.${colors.reset}`);
      console.log(`   Recommended to set for production.`);
    }
    console.log();
    process.exit(0);
  }
}

function maskValue(name: string, value: string): string {
  // 민감한 정보 마스킹
  const sensitivePatterns = ["SECRET", "KEY", "PASSWORD", "TOKEN"];
  const isSensitive = sensitivePatterns.some((pattern) => name.toUpperCase().includes(pattern));

  if (isSensitive) {
    if (value.length <= 8) {
      return "****";
    }
    return value.substring(0, 4) + "****" + value.substring(value.length - 4);
  }

  // URL은 그대로 표시 (도메인 정도는 공개 가능)
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  // 그 외는 일부만 표시
  if (value.length > 20) {
    return value.substring(0, 10) + "..." + value.substring(value.length - 5);
  }

  return value;
}

// 실행
checkEnvVars();
