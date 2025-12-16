/**
 * OpenNext configuration for Cloudflare Pages
 * @see https://opennext.js.org/cloudflare
 */
import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

export default defineCloudflareConfig({
  // 기본 설정 사용
  // 향후 R2 캐시, KV 바인딩 등 추가 가능
  
  // 예시: 캐시 설정 (R2 사용 시)
  // cache: {
  //   type: "r2",
  //   r2Binding: "CACHE_BUCKET",
  // },
  
  // 예시: 증분 캐시 (KV 사용 시)
  // incrementalCache: {
  //   type: "kv",
  //   kvBinding: "VIBE_CACHE",
  // },
});
