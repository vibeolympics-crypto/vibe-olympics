import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase 클라이언트 (lazy initialization)
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

// 클라이언트용 Supabase 인스턴스 (레거시 호환)
export const supabase = {
  get storage() {
    return getSupabaseClient().storage;
  },
  get auth() {
    return getSupabaseClient().auth;
  },
  get from() {
    return getSupabaseClient().from.bind(getSupabaseClient());
  },
};

// 서버용 Supabase 인스턴스 (서비스 롤 키 사용)
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// 스토리지 버킷 이름
export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: "product-images",
  PRODUCT_FILES: "product-files",
  USER_AVATARS: "user-avatars",
} as const;

// 파일 URL 생성
export function getPublicUrl(bucket: string, path: string): string {
  const client = getSupabaseClient();
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// 파일 크기 제한 (바이트)
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  PRODUCT_FILE: 100 * 1024 * 1024, // 100MB
  AVATAR: 2 * 1024 * 1024, // 2MB
} as const;

// 허용 파일 타입
export const ALLOWED_FILE_TYPES = {
  IMAGE: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  PRODUCT_FILE: [
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/pdf",
    "text/plain",
    "application/json",
  ],
  AVATAR: ["image/jpeg", "image/png", "image/webp"],
} as const;
