/**
 * Production Readiness Test Script
 * 
 * Tests external service connections:
 * - Stripe API
 * - Resend API
 * - Sentry DSN
 * - Database connection
 * 
 * Usage: npx tsx scripts/test-services.ts
 */

import 'dotenv/config';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

interface TestResult {
  service: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  latency?: number;
}

const results: TestResult[] = [];

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testStripe(): Promise<void> {
  log('\n📦 Testing Stripe connection...', colors.cyan);
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    results.push({
      service: 'Stripe',
      status: 'skip',
      message: 'STRIPE_SECRET_KEY not set',
    });
    return;
  }

  const isTestKey = secretKey.startsWith('sk_test_');
  const isLiveKey = secretKey.startsWith('sk_live_');

  if (!isTestKey && !isLiveKey) {
    results.push({
      service: 'Stripe',
      status: 'fail',
      message: 'Invalid Stripe secret key format',
    });
    return;
  }

  try {
    const start = Date.now();
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });
    const latency = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      results.push({
        service: 'Stripe',
        status: 'pass',
        message: `Connected (${isTestKey ? 'TEST' : 'LIVE'} mode) - Available balance currencies: ${data.available?.length || 0}`,
        latency,
      });
    } else {
      const error = await response.json();
      results.push({
        service: 'Stripe',
        status: 'fail',
        message: error.error?.message || 'API request failed',
        latency,
      });
    }
  } catch (error) {
    results.push({
      service: 'Stripe',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Connection failed',
    });
  }
}

async function testResend(): Promise<void> {
  log('\n📧 Testing Resend connection...', colors.cyan);
  
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    results.push({
      service: 'Resend',
      status: 'skip',
      message: 'RESEND_API_KEY not set',
    });
    return;
  }

  try {
    const start = Date.now();
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const latency = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      const domains = data.data || [];
      const verifiedDomains = domains.filter((d: { status: string }) => d.status === 'verified');
      
      results.push({
        service: 'Resend',
        status: 'pass',
        message: `Connected - ${verifiedDomains.length} verified domain(s)`,
        latency,
      });
    } else if (response.status === 401) {
      results.push({
        service: 'Resend',
        status: 'fail',
        message: 'Invalid API key',
        latency,
      });
    } else {
      results.push({
        service: 'Resend',
        status: 'fail',
        message: `API error: ${response.status}`,
        latency,
      });
    }
  } catch (error) {
    results.push({
      service: 'Resend',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Connection failed',
    });
  }
}

async function testSentry(): Promise<void> {
  log('\n🔍 Testing Sentry DSN...', colors.cyan);
  
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    results.push({
      service: 'Sentry',
      status: 'skip',
      message: 'SENTRY_DSN not set',
    });
    return;
  }

  // Parse DSN to validate format
  try {
    const url = new URL(dsn);
    const isValidFormat = url.protocol === 'https:' && 
                         url.hostname.includes('sentry.io') &&
                         url.pathname.length > 1;
    
    if (isValidFormat) {
      // Try to reach the Sentry ingest endpoint
      const start = Date.now();
      const response = await fetch(`${url.protocol}//${url.host}/api/0/`, {
        method: 'HEAD',
      });
      const latency = Date.now() - start;

      results.push({
        service: 'Sentry',
        status: 'pass',
        message: `DSN valid - Project ID: ${url.pathname.slice(1)}`,
        latency,
      });
    } else {
      results.push({
        service: 'Sentry',
        status: 'fail',
        message: 'Invalid DSN format',
      });
    }
  } catch {
    results.push({
      service: 'Sentry',
      status: 'fail',
      message: 'Invalid DSN URL',
    });
  }
}

async function testDatabase(): Promise<void> {
  log('\n💾 Testing Database connection...', colors.cyan);
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    results.push({
      service: 'Database',
      status: 'skip',
      message: 'DATABASE_URL not set',
    });
    return;
  }

  try {
    // Dynamic import to avoid issues if prisma client isn't generated
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    await prisma.$disconnect();

    results.push({
      service: 'Database',
      status: 'pass',
      message: 'Connected successfully',
      latency,
    });
  } catch (error) {
    results.push({
      service: 'Database',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Connection failed',
    });
  }
}

async function testSupabase(): Promise<void> {
  log('\n☁️ Testing Supabase connection...', colors.cyan);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !anonKey) {
    results.push({
      service: 'Supabase',
      status: 'skip',
      message: 'Supabase environment variables not set',
    });
    return;
  }

  try {
    const start = Date.now();
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    const latency = Date.now() - start;

    if (response.ok || response.status === 400) {
      // 400 is expected when no table is specified
      results.push({
        service: 'Supabase',
        status: 'pass',
        message: 'API reachable',
        latency,
      });
    } else {
      results.push({
        service: 'Supabase',
        status: 'fail',
        message: `API error: ${response.status}`,
        latency,
      });
    }
  } catch (error) {
    results.push({
      service: 'Supabase',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Connection failed',
    });
  }
}

async function testGitHubOAuth(): Promise<void> {
  log('\n🐙 Testing GitHub OAuth configuration...', colors.cyan);
  
  const clientId = process.env.GITHUB_ID;
  const clientSecret = process.env.GITHUB_SECRET;
  
  if (!clientId || !clientSecret) {
    results.push({
      service: 'GitHub OAuth',
      status: 'skip',
      message: 'GitHub OAuth credentials not set',
    });
    return;
  }

  // We can't fully test OAuth without redirects, but we can validate the format
  const isValidClientId = clientId.length >= 10;
  const isValidSecret = clientSecret.length >= 20;

  if (isValidClientId && isValidSecret) {
    results.push({
      service: 'GitHub OAuth',
      status: 'pass',
      message: `Credentials configured (Client ID: ${clientId.substring(0, 8)}...)`,
    });
  } else {
    results.push({
      service: 'GitHub OAuth',
      status: 'fail',
      message: 'Invalid credential format',
    });
  }
}

function printSummary(): void {
  log('\n' + '='.repeat(60), colors.dim);
  log('📋 SERVICE CONNECTION TEST SUMMARY', colors.cyan);
  log('='.repeat(60), colors.dim);

  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const result of results) {
    let statusIcon: string;
    let statusColor: string;

    switch (result.status) {
      case 'pass':
        statusIcon = '✅';
        statusColor = colors.green;
        passCount++;
        break;
      case 'fail':
        statusIcon = '❌';
        statusColor = colors.red;
        failCount++;
        break;
      case 'skip':
        statusIcon = '⏭️';
        statusColor = colors.yellow;
        skipCount++;
        break;
    }

    const latencyStr = result.latency ? ` (${result.latency}ms)` : '';
    log(`${statusIcon} ${result.service}: ${statusColor}${result.message}${colors.reset}${latencyStr}`);
  }

  log('\n' + '-'.repeat(60), colors.dim);
  log(`Total: ${passCount} passed, ${failCount} failed, ${skipCount} skipped`);
  
  if (failCount === 0 && skipCount === 0) {
    log('\n🎉 All services are properly configured!', colors.green);
  } else if (failCount > 0) {
    log('\n⚠️ Some services failed. Check configuration before deploying.', colors.red);
  } else {
    log('\n📝 Some services were skipped. Configure them if needed.', colors.yellow);
  }
}

async function main(): Promise<void> {
  log('🚀 Vibe Olympics - Production Readiness Test', colors.cyan);
  log('='.repeat(60), colors.dim);

  await testDatabase();
  await testStripe();
  await testResend();
  await testSentry();
  await testSupabase();
  await testGitHubOAuth();

  printSummary();
  
  // Exit with error code if any tests failed
  const hasFailed = results.some(r => r.status === 'fail');
  process.exit(hasFailed ? 1 : 0);
}

main();
