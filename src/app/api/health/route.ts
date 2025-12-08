import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    environment: {
      status: 'ok' | 'error';
      missing?: string[];
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: { status: 'ok' },
      environment: { status: 'ok' },
    },
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database.latency = Date.now() - dbStart;
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
  }

  // Check critical environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    health.status = 'unhealthy';
    health.checks.environment = {
      status: 'error',
      missing: missingEnvVars,
    };
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  const totalLatency = Date.now() - startTime;

  return NextResponse.json(
    { ...health, totalLatency },
    { status: statusCode }
  );
}
