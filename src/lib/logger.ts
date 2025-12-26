/**
 * 구조화된 로깅 시스템
 * - 환경별 로그 레벨 제어
 * - 구조화된 로그 포맷 (timestamp, level, context)
 * - Sentry 연동 (에러 시)
 * - 서버/클라이언트 자동 감지
 */

import * as Sentry from '@sentry/nextjs';

// 로그 레벨 정의
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 로그 레벨 우선순위
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// 환경별 기본 로그 레벨
const getDefaultLogLevel = (): LogLevel => {
  if (process.env.NODE_ENV === 'production') return 'warn';
  if (process.env.NODE_ENV === 'test') return 'error';
  return 'debug';
};

// 로그 컨텍스트 타입
interface LogContext {
  module?: string;
  action?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

// 구조화된 로그 엔트리
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  isServer: boolean;
}

// 현재 로그 레벨 (환경변수로 오버라이드 가능)
const currentLogLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || getDefaultLogLevel();

// 서버/클라이언트 감지
const isServer = typeof window === 'undefined';

// 로그 레벨이 현재 설정보다 높거나 같은지 확인
const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
};

// 로그 포맷터
const formatLog = (entry: LogEntry): string => {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const location = entry.isServer ? '[SERVER]' : '[CLIENT]';
  const module = entry.context?.module ? `[${entry.context.module}]` : '';

  return `${prefix} ${location}${module} ${entry.message}`;
};

// 구조화된 로그 객체 생성
const createLogEntry = (
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  context,
  error,
  isServer,
});

// 메인 로거 클래스
class Logger {
  private context?: LogContext;

  constructor(context?: LogContext) {
    this.context = context;
  }

  // 컨텍스트가 있는 새 로거 생성
  withContext(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context });
  }

  // 일반 로그 (하위 호환성 - console.log와 동일한 시그니처)
  log(...args: unknown[]): void {
    if (!shouldLog('info')) return;
    const entry = createLogEntry('info', args.map(a => String(a)).join(' '), this.context);
    console.log(formatLog(entry), ...args);
  }

  // 디버그 로그
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return;

    const entry = createLogEntry('debug', message, { ...this.context, ...context });
    console.debug(formatLog(entry), entry.context || '');
  }

  // 정보 로그
  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return;

    const entry = createLogEntry('info', message, { ...this.context, ...context });
    console.info(formatLog(entry), entry.context || '');
  }

  // 경고 로그
  warn(message: string, context?: LogContext): void {
    if (!shouldLog('warn')) return;

    const entry = createLogEntry('warn', message, { ...this.context, ...context });
    console.warn(formatLog(entry), entry.context || '');
  }

  // 에러 로그 (항상 출력 + Sentry 전송)
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : undefined;
    const entry = createLogEntry('error', message, { ...this.context, ...context }, err);

    console.error(formatLog(entry), entry.context || '', err || '');

    // Sentry에 에러 전송 (프로덕션)
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      if (err) {
        Sentry.captureException(err, {
          extra: {
            message,
            ...entry.context,
          },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: entry.context,
        });
      }
    }
  }

  // API 요청 로깅 헬퍼
  api(method: string, path: string, status?: number, duration?: number): void {
    const statusEmoji = status
      ? status >= 500 ? '❌'
        : status >= 400 ? '⚠️'
        : '✅'
      : '🔄';

    const durationStr = duration ? ` (${duration}ms)` : '';
    const statusStr = status ? ` ${status}` : '';

    this.info(`${statusEmoji} ${method} ${path}${statusStr}${durationStr}`, {
      module: 'API',
      method,
      path,
      status,
      duration,
    });
  }

  // 데이터베이스 쿼리 로깅 헬퍼
  db(operation: string, model: string, duration?: number): void {
    const durationStr = duration ? ` (${duration}ms)` : '';

    this.debug(`🗄️ ${operation} ${model}${durationStr}`, {
      module: 'DB',
      operation,
      model,
      duration,
    });
  }

  // 성능 측정 헬퍼
  measure<T>(label: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = Math.round(performance.now() - start);
      this.debug(`⏱️ ${label} completed`, { duration });
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      this.error(`⏱️ ${label} failed`, error, { duration });
      throw error;
    }
  }

  // 비동기 성능 측정 헬퍼
  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = Math.round(performance.now() - start);
      this.debug(`⏱️ ${label} completed`, { duration });
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      this.error(`⏱️ ${label} failed`, error, { duration });
      throw error;
    }
  }
}

// 싱글톤 로거 인스턴스
export const logger = new Logger();

// 하위 호환성을 위한 기본 export
export default logger;

// 모듈별 로거 생성 헬퍼
export const createLogger = (module: string): Logger => {
  return logger.withContext({ module });
};
