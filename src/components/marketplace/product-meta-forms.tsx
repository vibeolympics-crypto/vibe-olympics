"use client";

import {
  Book,
  Film,
  Music,
  User,
  Building2,
  Languages,
  FileAudio,
  FileVideo,
  Clock,
  Hash,
  Calendar,
  Sparkles,
  ListMusic,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BookType, VideoSeriesType, MusicGenre } from "@/types";

// ==========================
// 도서 메타데이터 폼
// ==========================

export interface BookMetaFormData {
  bookType: BookType;
  author: string;
  publisher: string;
  isbn: string;
  pageCount: number | null;
  chapters: number | null;
  language: string;
  format: string[];
  ageRating: string;
  seriesName: string;
  seriesOrder: number | null;
}

const bookTypeOptions: { id: BookType; name: string; icon: string }[] = [
  { id: "EBOOK", name: "전자책", icon: "📱" },
  { id: "COMIC", name: "만화/웹툰", icon: "📚" },
  { id: "PICTURE_BOOK", name: "그림책", icon: "🎨" },
  { id: "AUDIO_BOOK", name: "오디오북", icon: "🎧" },
];

const bookFormatOptions = [
  { id: "PDF", name: "PDF" },
  { id: "EPUB", name: "EPUB" },
  { id: "MOBI", name: "MOBI" },
  { id: "MP3", name: "MP3" },
  { id: "M4A", name: "M4A" },
];

const languageOptions = [
  { id: "ko", name: "한국어" },
  { id: "en", name: "영어" },
  { id: "ja", name: "일본어" },
  { id: "zh", name: "중국어" },
  { id: "multi", name: "다국어" },
];

const ageRatingOptions = [
  { id: "ALL", name: "전체 이용가" },
  { id: "12", name: "12세 이용가" },
  { id: "15", name: "15세 이용가" },
  { id: "18", name: "청소년 이용불가" },
];

interface BookMetaFormProps {
  data: Partial<BookMetaFormData>;
  onChange: (data: Partial<BookMetaFormData>) => void;
  errors?: Record<string, string>;
}

export function BookMetaForm({ data, onChange, errors }: BookMetaFormProps) {
  const handleChange = (field: keyof BookMetaFormData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const toggleFormat = (format: string) => {
    const current = data.format || [];
    const updated = current.includes(format)
      ? current.filter((f) => f !== format)
      : [...current, format];
    handleChange("format", updated);
  };

  return (
    <div className="space-y-6">
      {/* 도서 타입 */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          도서 타입 *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {bookTypeOptions.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => handleChange("bookType", type.id)}
              className={cn(
                "p-3 rounded-lg border text-center transition-all",
                data.bookType === type.id
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-primary)]"
                  : "border-[var(--bg-border)] hover:border-[var(--primary)]/50 text-[var(--text-tertiary)]"
              )}
            >
              <span className="text-xl mb-1 block">{type.icon}</span>
              <span className="text-xs">{type.name}</span>
            </button>
          ))}
        </div>
        {errors?.bookType && (
          <p className="text-sm text-[var(--semantic-error)] mt-1">
            {errors.bookType}
          </p>
        )}
      </div>

      {/* 저자 & 출판사 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            저자/작가명 *
          </label>
          <Input
            value={data.author || ""}
            onChange={(e) => handleChange("author", e.target.value)}
            placeholder="저자 이름"
            icon={<User className="w-4 h-4" />}
            error={errors?.author}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            출판사/레이블
          </label>
          <Input
            value={data.publisher || ""}
            onChange={(e) => handleChange("publisher", e.target.value)}
            placeholder="출판사명"
            icon={<Building2 className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* ISBN & 페이지 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            ISBN (선택)
          </label>
          <Input
            value={data.isbn || ""}
            onChange={(e) => handleChange("isbn", e.target.value)}
            placeholder="978-0-00-000000-0"
            icon={<Hash className="w-4 h-4" />}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            페이지 수
          </label>
          <Input
            type="number"
            value={data.pageCount || ""}
            onChange={(e) =>
              handleChange(
                "pageCount",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            placeholder="0"
            icon={<Book className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* 언어 & 이용등급 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            언어 *
          </label>
          <select
            value={data.language || "ko"}
            onChange={(e) => handleChange("language", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)]"
          >
            {languageOptions.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            이용 등급
          </label>
          <select
            value={data.ageRating || "ALL"}
            onChange={(e) => handleChange("ageRating", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)]"
          >
            {ageRatingOptions.map((rating) => (
              <option key={rating.id} value={rating.id}>
                {rating.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 파일 포맷 */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          제공 포맷 *
        </label>
        <div className="flex flex-wrap gap-2">
          {bookFormatOptions.map((format) => (
            <Badge
              key={format.id}
              variant={(data.format || []).includes(format.id) ? "success" : "secondary"}
              className={cn(
                "cursor-pointer transition-colors",
                (data.format || []).includes(format.id)
                  ? "bg-[var(--primary)] text-white"
                  : "hover:bg-[var(--primary)]/20"
              )}
              onClick={() => toggleFormat(format.id)}
            >
              {format.name}
            </Badge>
          ))}
        </div>
        {errors?.format && (
          <p className="text-sm text-[var(--semantic-error)] mt-1">
            {errors.format}
          </p>
        )}
      </div>

      {/* 시리즈 정보 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            시리즈명 (선택)
          </label>
          <Input
            value={data.seriesName || ""}
            onChange={(e) => handleChange("seriesName", e.target.value)}
            placeholder="시리즈가 있는 경우"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            시리즈 순서
          </label>
          <Input
            type="number"
            value={data.seriesOrder || ""}
            onChange={(e) =>
              handleChange(
                "seriesOrder",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            placeholder="1, 2, 3..."
          />
        </div>
      </div>
    </div>
  );
}

// ==========================
// 영상 시리즈 메타데이터 폼
// ==========================

export interface VideoSeriesMetaFormData {
  videoType: VideoSeriesType;
  director: string;
  cast: string[];
  duration: number | null;
  episodes: number | null;
  seasons: number | null;
  resolution: string;
  audioFormat: string;
  subtitles: string[];
  ageRating: string;
  genre: string[];
  trailerUrl: string;
  seriesName: string;
  seriesOrder: number | null;
}

const videoTypeOptions: { id: VideoSeriesType; name: string; icon: string }[] = [
  { id: "MOVIE", name: "영화", icon: "🎬" },
  { id: "ANIMATION", name: "애니메이션", icon: "🎨" },
  { id: "DOCUMENTARY", name: "다큐멘터리", icon: "📹" },
  { id: "SHORT_FILM", name: "단편영상", icon: "🎥" },
  { id: "SERIES", name: "시리즈", icon: "📺" },
];

const videoGenreOptions = [
  "액션", "코미디", "드라마", "호러", "SF", "판타지",
  "로맨스", "스릴러", "음악", "교육", "기타"
];

const resolutionOptions = [
  { id: "SD", name: "SD (480p)" },
  { id: "HD", name: "HD (720p)" },
  { id: "FHD", name: "Full HD (1080p)" },
  { id: "4K", name: "4K UHD" },
];

const audioFormatOptions = [
  { id: "STEREO", name: "스테레오" },
  { id: "5.1", name: "5.1 서라운드" },
  { id: "7.1", name: "7.1 서라운드" },
  { id: "ATMOS", name: "Dolby Atmos" },
];

interface VideoSeriesMetaFormProps {
  data: Partial<VideoSeriesMetaFormData>;
  onChange: (data: Partial<VideoSeriesMetaFormData>) => void;
  errors?: Record<string, string>;
}

export function VideoSeriesMetaForm({
  data,
  onChange,
  errors,
}: VideoSeriesMetaFormProps) {
  const handleChange = (field: keyof VideoSeriesMetaFormData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const toggleGenre = (genre: string) => {
    const current = data.genre || [];
    const updated = current.includes(genre)
      ? current.filter((g) => g !== genre)
      : [...current, genre];
    handleChange("genre", updated);
  };

  const toggleSubtitle = (lang: string) => {
    const current = data.subtitles || [];
    const updated = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    handleChange("subtitles", updated);
  };

  return (
    <div className="space-y-6">
      {/* 영상 타입 */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          영상 타입 *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {videoTypeOptions.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => handleChange("videoType", type.id)}
              className={cn(
                "p-3 rounded-lg border text-center transition-all",
                data.videoType === type.id
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-primary)]"
                  : "border-[var(--bg-border)] hover:border-[var(--primary)]/50 text-[var(--text-tertiary)]"
              )}
            >
              <span className="text-xl mb-1 block">{type.icon}</span>
              <span className="text-xs">{type.name}</span>
            </button>
          ))}
        </div>
        {errors?.videoType && (
          <p className="text-sm text-[var(--semantic-error)] mt-1">
            {errors.videoType}
          </p>
        )}
      </div>

      {/* 감독 & 출연진 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            감독/제작자
          </label>
          <Input
            value={data.director || ""}
            onChange={(e) => handleChange("director", e.target.value)}
            placeholder="감독 또는 제작자명"
            icon={<User className="w-4 h-4" />}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            출연진 (쉼표로 구분)
          </label>
          <Input
            value={(data.cast || []).join(", ")}
            onChange={(e) =>
              handleChange(
                "cast",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
              )
            }
            placeholder="배우1, 배우2, 배우3"
            icon={<User className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* 에피소드 & 재생시간 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            에피소드 수
          </label>
          <Input
            type="number"
            value={data.episodes || ""}
            onChange={(e) =>
              handleChange(
                "episodes",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            placeholder="1"
            icon={<Film className="w-4 h-4" />}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            시즌 수
          </label>
          <Input
            type="number"
            value={data.seasons || ""}
            onChange={(e) =>
              handleChange(
                "seasons",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            placeholder="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            총 재생시간 (분)
          </label>
          <Input
            type="number"
            value={data.duration || ""}
            onChange={(e) =>
              handleChange(
                "duration",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            placeholder="120"
            icon={<Clock className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* 해상도 & 오디오 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            해상도
          </label>
          <select
            value={data.resolution || "FHD"}
            onChange={(e) => handleChange("resolution", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)]"
          >
            {resolutionOptions.map((res) => (
              <option key={res.id} value={res.id}>
                {res.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            오디오 포맷
          </label>
          <select
            value={data.audioFormat || "STEREO"}
            onChange={(e) => handleChange("audioFormat", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)]"
          >
            {audioFormatOptions.map((format) => (
              <option key={format.id} value={format.id}>
                {format.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 장르 */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          장르 (복수 선택 가능)
        </label>
        <div className="flex flex-wrap gap-2">
          {videoGenreOptions.map((genre) => (
            <Badge
              key={genre}
              variant={(data.genre || []).includes(genre) ? "success" : "secondary"}
              className={cn(
                "cursor-pointer transition-colors",
                (data.genre || []).includes(genre)
                  ? "bg-[var(--primary)] text-white"
                  : "hover:bg-[var(--primary)]/20"
              )}
              onClick={() => toggleGenre(genre)}
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>

      {/* 자막 언어 */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          자막 언어 (복수 선택 가능)
        </label>
        <div className="flex flex-wrap gap-2">
          {languageOptions.map((lang) => (
            <Badge
              key={lang.id}
              variant={(data.subtitles || []).includes(lang.id) ? "success" : "secondary"}
              className={cn(
                "cursor-pointer transition-colors",
                (data.subtitles || []).includes(lang.id)
                  ? "bg-[var(--accent-cyan)] text-white"
                  : "hover:bg-[var(--accent-cyan)]/20"
              )}
              onClick={() => toggleSubtitle(lang.id)}
            >
              <Languages className="w-3 h-3 mr-1" />
              {lang.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* 트레일러 URL */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          트레일러 URL (선택)
        </label>
        <Input
          value={data.trailerUrl || ""}
          onChange={(e) => handleChange("trailerUrl", e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          icon={<FileVideo className="w-4 h-4" />}
        />
      </div>

      {/* 이용 등급 */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          이용 등급
        </label>
        <select
          value={data.ageRating || "ALL"}
          onChange={(e) => handleChange("ageRating", e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)]"
        >
          {ageRatingOptions.map((rating) => (
            <option key={rating.id} value={rating.id}>
              {rating.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ==========================
// 음악 앨범 메타데이터 폼
// ==========================

export interface MusicAlbumMetaFormData {
  artist: string;
  albumType: string;
  genre: MusicGenre;
  subGenre: string;
  mood: string[];
  trackCount: number | null;
  totalDuration: number | null;
  format: string[];
  bitrate: string;
  sampleRate: string;
  theme: string;
  hasLyrics: boolean;
  isInstrumental: boolean;
}

const musicGenreOptions: { id: MusicGenre; name: string }[] = [
  { id: "POP", name: "팝" },
  { id: "ROCK", name: "록" },
  { id: "HIPHOP", name: "힙합" },
  { id: "RNB", name: "R&B" },
  { id: "ELECTRONIC", name: "일렉트로닉" },
  { id: "CLASSICAL", name: "클래식" },
  { id: "JAZZ", name: "재즈" },
  { id: "AMBIENT", name: "앰비언트" },
  { id: "SOUNDTRACK", name: "사운드트랙" },
  { id: "WORLD", name: "월드뮤직" },
  { id: "OTHER", name: "기타" },
];

const albumTypeOptions = [
  { id: "FULL", name: "정규 앨범" },
  { id: "EP", name: "EP" },
  { id: "SINGLE", name: "싱글" },
  { id: "COMPILATION", name: "컴필레이션" },
  { id: "SOUNDTRACK", name: "OST" },
];

const audioQualityOptions = [
  { id: "MP3_128", name: "MP3 128kbps" },
  { id: "MP3_320", name: "MP3 320kbps" },
  { id: "FLAC", name: "FLAC (무손실)" },
  { id: "WAV", name: "WAV (무손실)" },
];

const moodOptions = [
  "신나는", "잔잔한", "우울한", "로맨틱한", "에너제틱",
  "평화로운", "몽환적인", "강렬한", "감성적인", "밝은"
];

interface MusicAlbumMetaFormProps {
  data: Partial<MusicAlbumMetaFormData>;
  onChange: (data: Partial<MusicAlbumMetaFormData>) => void;
  errors?: Record<string, string>;
}

export function MusicAlbumMetaForm({
  data,
  onChange,
  errors,
}: MusicAlbumMetaFormProps) {
  const handleChange = (field: keyof MusicAlbumMetaFormData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const toggleMood = (mood: string) => {
    const current = data.mood || [];
    const updated = current.includes(mood)
      ? current.filter((m) => m !== mood)
      : [...current, mood];
    handleChange("mood", updated);
  };

  const toggleFormat = (format: string) => {
    const current = data.format || [];
    const updated = current.includes(format)
      ? current.filter((f) => f !== format)
      : [...current, format];
    handleChange("format", updated);
  };

  return (
    <div className="space-y-6">
      {/* 아티스트 & 앨범 타입 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            아티스트/작곡가 *
          </label>
          <Input
            value={data.artist || ""}
            onChange={(e) => handleChange("artist", e.target.value)}
            placeholder="아티스트명"
            icon={<User className="w-4 h-4" />}
            error={errors?.artist}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            앨범 타입 *
          </label>
          <select
            value={data.albumType || "FULL"}
            onChange={(e) => handleChange("albumType", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)]"
          >
            {albumTypeOptions.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 장르 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            장르 *
          </label>
          <select
            value={data.genre || "OTHER"}
            onChange={(e) => handleChange("genre", e.target.value as MusicGenre)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)]"
          >
            {musicGenreOptions.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
          {errors?.genre && (
            <p className="text-sm text-[var(--semantic-error)] mt-1">
              {errors.genre}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            서브 장르
          </label>
          <Input
            value={data.subGenre || ""}
            onChange={(e) => handleChange("subGenre", e.target.value)}
            placeholder="세부 장르"
          />
        </div>
      </div>

      {/* 트랙 수 & 총 재생시간 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            트랙 수 *
          </label>
          <Input
            type="number"
            value={data.trackCount || ""}
            onChange={(e) =>
              handleChange(
                "trackCount",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            placeholder="10"
            icon={<ListMusic className="w-4 h-4" />}
            error={errors?.trackCount}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            총 재생시간 (분)
          </label>
          <Input
            type="number"
            value={data.totalDuration || ""}
            onChange={(e) =>
              handleChange(
                "totalDuration",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            placeholder="45"
            icon={<Clock className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* 무드 */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          분위기/무드 (복수 선택 가능)
        </label>
        <div className="flex flex-wrap gap-2">
          {moodOptions.map((mood) => (
            <Badge
              key={mood}
              variant={(data.mood || []).includes(mood) ? "success" : "secondary"}
              className={cn(
                "cursor-pointer transition-colors",
                (data.mood || []).includes(mood)
                  ? "bg-[var(--accent-violet)] text-white"
                  : "hover:bg-[var(--accent-violet)]/20"
              )}
              onClick={() => toggleMood(mood)}
            >
              {mood}
            </Badge>
          ))}
        </div>
      </div>

      {/* 음질 포맷 */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          제공 음질 *
        </label>
        <div className="flex flex-wrap gap-2">
          {audioQualityOptions.map((format) => (
            <Badge
              key={format.id}
              variant={(data.format || []).includes(format.id) ? "success" : "secondary"}
              className={cn(
                "cursor-pointer transition-colors",
                (data.format || []).includes(format.id)
                  ? "bg-[var(--primary)] text-white"
                  : "hover:bg-[var(--primary)]/20"
              )}
              onClick={() => toggleFormat(format.id)}
            >
              <FileAudio className="w-3 h-3 mr-1" />
              {format.name}
            </Badge>
          ))}
        </div>
        {errors?.format && (
          <p className="text-sm text-[var(--semantic-error)] mt-1">
            {errors.format}
          </p>
        )}
      </div>

      {/* 가사 & 인스트루멘탈 */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.hasLyrics || false}
            onChange={(e) => handleChange("hasLyrics", e.target.checked)}
            className="w-4 h-4 rounded border-[var(--bg-border)] text-[var(--primary)]"
          />
          <span className="text-sm text-[var(--text-secondary)]">가사 포함</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isInstrumental || false}
            onChange={(e) => handleChange("isInstrumental", e.target.checked)}
            className="w-4 h-4 rounded border-[var(--bg-border)] text-[var(--primary)]"
          />
          <span className="text-sm text-[var(--text-secondary)]">
            인스트루멘탈 (보컬 없음)
          </span>
        </label>
      </div>

      {/* 테마 */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
          테마/용도 (선택)
        </label>
        <Input
          value={data.theme || ""}
          onChange={(e) => handleChange("theme", e.target.value)}
          placeholder="예: 유튜브 배경음악, 명상, 운동 등"
          icon={<Sparkles className="w-4 h-4" />}
        />
      </div>
    </div>
  );
}

// ==========================
// AI 생성 정보 폼
// ==========================

export interface AiGeneratedFormData {
  isAiGenerated: boolean;
  aiTool: string;
  aiPrompt: string;
}

const aiToolOptions = [
  { id: "chatgpt", name: "ChatGPT" },
  { id: "claude", name: "Claude" },
  { id: "midjourney", name: "Midjourney" },
  { id: "dall-e", name: "DALL-E" },
  { id: "stable-diffusion", name: "Stable Diffusion" },
  { id: "suno", name: "Suno AI" },
  { id: "udio", name: "Udio" },
  { id: "runway", name: "Runway" },
  { id: "pika", name: "Pika" },
  { id: "kaiber", name: "Kaiber" },
  { id: "other", name: "기타" },
];

interface AiGeneratedFormProps {
  data: Partial<AiGeneratedFormData>;
  onChange: (data: Partial<AiGeneratedFormData>) => void;
}

export function AiGeneratedForm({ data, onChange }: AiGeneratedFormProps) {
  const handleChange = (field: keyof AiGeneratedFormData, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* AI 생성 여부 토글 */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)]">
        <div>
          <p className="font-medium text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-violet)]" />
            AI로 생성된 콘텐츠
          </p>
          <p className="text-sm text-[var(--text-tertiary)]">
            AI 도구를 사용하여 생성된 콘텐츠인 경우 체크해주세요
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={data.isAiGenerated || false}
            onChange={(e) => {
              handleChange("isAiGenerated", e.target.checked);
              if (!e.target.checked) {
                handleChange("aiTool", "");
                handleChange("aiPrompt", "");
              }
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-[var(--bg-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-violet)]"></div>
        </label>
      </div>

      {data.isAiGenerated && (
        <>
          {/* AI 도구 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              사용한 AI 도구 *
            </label>
            <select
              value={data.aiTool || ""}
              onChange={(e) => handleChange("aiTool", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)]"
            >
              <option value="">선택해주세요</option>
              {aiToolOptions.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.name}
                </option>
              ))}
            </select>
          </div>

          {/* AI 프롬프트 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              사용한 프롬프트 (선택)
            </label>
            <textarea
              value={data.aiPrompt || ""}
              onChange={(e) => handleChange("aiPrompt", e.target.value)}
              placeholder="AI 콘텐츠 생성에 사용한 프롬프트를 입력해주세요 (선택사항)"
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)] resize-none"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              프롬프트를 공개하면 구매자가 콘텐츠를 더 잘 이해하고 활용할 수 있습니다
            </p>
          </div>

          {/* 안내 메시지 */}
          <div className="p-4 rounded-lg bg-[var(--accent-violet)]/5 border border-[var(--accent-violet)]/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[var(--accent-violet)] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-[var(--text-primary)] mb-1">
                  AI 생성 콘텐츠 안내
                </h4>
                <ul className="text-sm text-[var(--text-tertiary)] space-y-1">
                  <li>• AI 도구 표기는 구매자 신뢰를 높이는 데 도움이 됩니다</li>
                  <li>• 사용한 AI 도구와 방법을 투명하게 공개해주세요</li>
                  <li>• AI 저작권 관련 정책을 확인하고 판매해주세요</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
