/**
 * 개발 환경 전용 로거
 * 프로덕션에서는 console.log 출력 안 함
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    // 에러는 항상 출력 (프로덕션에서도 디버깅 필요)
    console.error(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};

export default logger;
