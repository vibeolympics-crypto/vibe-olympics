'use client';

/**
 * 소셜 미디어 관리 컴포넌트
 * 자동 홍보 포스팅 시스템 UI
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'threads';

interface SocialAccount {
  platform: SocialPlatform;
  username: string;
  isConnected: boolean;
}

interface SocialPost {
  id: string;
  platform: SocialPlatform;
  type: string;
  content: string;
  hashtags: string[];
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    impressions: number;
    reach: number;
    engagementRate: number;
  };
  createdAt: string;
}

interface PostTemplate {
  id: string;
  name: string;
  platform: string;
  type: string;
  content: string;
  hashtags: string[];
}

// Platform Icons & Colors
const PLATFORM_INFO: Record<SocialPlatform, { icon: string; name: string; color: string; bgColor: string }> = {
  twitter: { icon: '𝕏', name: 'Twitter/X', color: 'text-black dark:text-white', bgColor: 'bg-black' },
  facebook: { icon: '📘', name: 'Facebook', color: 'text-blue-600', bgColor: 'bg-blue-600' },
  instagram: { icon: '📷', name: 'Instagram', color: 'text-pink-600', bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  linkedin: { icon: '💼', name: 'LinkedIn', color: 'text-blue-700', bgColor: 'bg-blue-700' },
  threads: { icon: '🧵', name: 'Threads', color: 'text-black dark:text-white', bgColor: 'bg-black' },
};

// API Functions
const fetchAccounts = async (): Promise<SocialAccount[]> => {
  const response = await fetch('/api/social?type=accounts');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data.data;
};

const fetchPosts = async (): Promise<SocialPost[]> => {
  const response = await fetch('/api/social?type=demo');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data.data;
};

const fetchTemplates = async (): Promise<PostTemplate[]> => {
  const response = await fetch('/api/social?type=templates');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data.data;
};

export function SocialMediaManager() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'compose' | 'posts' | 'analytics'>('accounts');
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: fetchAccounts,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['social-posts'],
    queryFn: fetchPosts,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['social-templates'],
    queryFn: fetchTemplates,
  });

  const connectMutation = useMutation({
    mutationFn: async (platform: SocialPlatform) => {
      const response = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', platform }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    },
  });

  const tabs = [
    { id: 'accounts', label: '연결된 계정', icon: '🔗' },
    { id: 'compose', label: '포스트 작성', icon: '✏️' },
    { id: 'posts', label: '포스트 관리', icon: '📋' },
    { id: 'analytics', label: '성과 분석', icon: '📊' },
  ] as const;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">소셜 미디어 관리</h2>
        <p className="text-pink-100 text-sm">자동 홍보 포스팅으로 마케팅을 강화하세요</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-pink-600 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'accounts' && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AccountsTab
                accounts={accounts}
                onConnect={(platform) => connectMutation.mutate(platform)}
                isConnecting={connectMutation.isPending}
              />
            </motion.div>
          )}

          {activeTab === 'compose' && (
            <motion.div
              key="compose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ComposeTab accounts={accounts} templates={templates} />
            </motion.div>
          )}

          {activeTab === 'posts' && (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PostsTab posts={posts} />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AnalyticsTab posts={posts} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Accounts Tab
function AccountsTab({
  accounts,
  onConnect,
  isConnecting,
}: {
  accounts: SocialAccount[];
  onConnect: (platform: SocialPlatform) => void;
  isConnecting: boolean;
}) {
  const platforms: SocialPlatform[] = ['twitter', 'facebook', 'instagram', 'linkedin', 'threads'];

  return (
    <div className="space-y-4">
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        소셜 미디어 계정을 연결하여 자동으로 포스트를 공유하세요.
      </p>

      <div className="grid gap-4">
        {platforms.map((platform) => {
          const info = PLATFORM_INFO[platform];
          const isConnected = accounts.some(a => a.platform === platform && a.isConnected);
          const account = accounts.find(a => a.platform === platform);

          return (
            <div
              key={platform}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${info.bgColor} rounded-full flex items-center justify-center text-white text-xl`}>
                  {info.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{info.name}</h3>
                  {isConnected && account ? (
                    <p className="text-sm text-green-600">@{account.username}</p>
                  ) : (
                    <p className="text-sm text-gray-500">연결되지 않음</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => !isConnected && onConnect(platform)}
                disabled={isConnecting}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isConnected
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-pink-600 text-white hover:bg-pink-700'
                }`}
              >
                {isConnected ? '✓ 연결됨' : '연결하기'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">💡 팁</h4>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          여러 플랫폼에 동시에 포스팅하여 도달 범위를 넓히세요.
          각 플랫폼별로 최적화된 콘텐츠가 자동 생성됩니다.
        </p>
      </div>
    </div>
  );
}

// Compose Tab
function ComposeTab({
  accounts,
  templates,
}: {
  accounts: SocialAccount[];
  templates: PostTemplate[];
}) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [postType, setPostType] = useState<'product' | 'promotion' | 'achievement' | 'custom'>('product');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const connectedPlatforms = accounts.filter(a => a.isConnected).map(a => a.platform);

  const togglePlatform = (platform: SocialPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const generateContent = async () => {
    if (selectedPlatforms.length === 0) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          options: {
            platform: selectedPlatforms[0],
            type: postType,
            language: 'ko',
            tone: 'excited',
            product: postType === 'product' ? {
              id: 'demo',
              name: '샘플 디지털 아트워크',
              description: '아름다운 디지털 페인팅입니다.',
              price: 35000,
              category: 'artwork',
              productUrl: 'https://example.com/product/1',
            } : undefined,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setContent(data.data.content);
        setHashtags(data.data.hashtags.join(' '));
      }
    } catch (error) {
      console.error('Content generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!content || selectedPlatforms.length === 0) return;

    // 실제 구현시 포스트 생성 API 호출
    alert('포스트가 예약되었습니다!');
  };

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          플랫폼 선택
        </label>
        <div className="flex flex-wrap gap-2">
          {connectedPlatforms.map((platform) => {
            const info = PLATFORM_INFO[platform];
            const isSelected = selectedPlatforms.includes(platform);

            return (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  isSelected
                    ? `${info.bgColor} text-white`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{info.icon}</span>
                <span>{info.name}</span>
              </button>
            );
          })}
        </div>
        {connectedPlatforms.length === 0 && (
          <p className="text-sm text-orange-600 mt-2">먼저 소셜 미디어 계정을 연결해주세요.</p>
        )}
      </div>

      {/* Post Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          포스트 유형
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['product', 'promotion', 'achievement', 'custom'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setPostType(type)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                postType === type
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {type === 'product' ? '상품 홍보' :
               type === 'promotion' ? '프로모션' :
               type === 'achievement' ? '성과 공유' : '직접 작성'}
            </button>
          ))}
        </div>
      </div>

      {/* AI Generate Button */}
      {postType !== 'custom' && selectedPlatforms.length > 0 && (
        <button
          onClick={generateContent}
          disabled={isGenerating}
          className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
        >
          {isGenerating ? '생성 중...' : '✨ AI로 콘텐츠 생성'}
        </button>
      )}

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          내용
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="포스트 내용을 입력하세요..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-pink-500"
        />
        <div className="text-right text-sm text-gray-500 mt-1">
          {content.length} / 280자
        </div>
      </div>

      {/* Hashtags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          해시태그
        </label>
        <input
          type="text"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="#태그1 #태그2 #태그3"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
        />
      </div>

      {/* Submit */}
      <div className="flex space-x-3">
        <button
          onClick={handleSubmit}
          disabled={!content || selectedPlatforms.length === 0}
          className="flex-1 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          지금 게시하기
        </button>
        <button
          disabled={!content || selectedPlatforms.length === 0}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          예약하기
        </button>
      </div>
    </div>
  );
}

// Posts Tab
function PostsTab({ posts }: { posts: SocialPost[] }) {
  const [filter, setFilter] = useState<'all' | 'published' | 'scheduled' | 'draft'>('all');

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    return post.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex space-x-2">
        {(['all', 'published', 'scheduled', 'draft'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {f === 'all' ? '전체' :
             f === 'published' ? '게시됨' :
             f === 'scheduled' ? '예약됨' : '임시저장'}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            포스트가 없습니다.
          </div>
        ) : (
          filteredPosts.map((post) => {
            const platformInfo = PLATFORM_INFO[post.platform];

            return (
              <div
                key={post.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={platformInfo.color}>{platformInfo.icon}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {platformInfo.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(post.status)}`}>
                      {post.status === 'published' ? '게시됨' :
                       post.status === 'scheduled' ? '예약됨' : '임시저장'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('ko-KR')
                      : post.scheduledAt
                      ? `예약: ${new Date(post.scheduledAt).toLocaleDateString('ko-KR')}`
                      : new Date(post.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <p className="text-gray-900 dark:text-white whitespace-pre-wrap mb-3">
                  {post.content}
                </p>

                {post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.hashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 text-sm rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {post.engagement && (
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span>❤️ {post.engagement.likes}</span>
                    <span>💬 {post.engagement.comments}</span>
                    <span>🔄 {post.engagement.shares}</span>
                    <span>👁️ {post.engagement.reach}</span>
                    <span className="text-green-600">
                      참여율 {post.engagement.engagementRate.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Analytics Tab
function AnalyticsTab({ posts }: { posts: SocialPost[] }) {
  const publishedPosts = posts.filter(p => p.status === 'published');
  
  const totalEngagement = publishedPosts.reduce(
    (sum, p) => sum + (p.engagement?.likes || 0) + (p.engagement?.comments || 0) + (p.engagement?.shares || 0),
    0
  );

  const totalReach = publishedPosts.reduce(
    (sum, p) => sum + (p.engagement?.reach || 0),
    0
  );

  const avgEngagementRate = publishedPosts.length > 0
    ? publishedPosts.reduce((sum, p) => sum + (p.engagement?.engagementRate || 0), 0) / publishedPosts.length
    : 0;

  // Platform breakdown
  const platformStats: Record<SocialPlatform, { posts: number; engagement: number; reach: number }> = {
    twitter: { posts: 0, engagement: 0, reach: 0 },
    facebook: { posts: 0, engagement: 0, reach: 0 },
    instagram: { posts: 0, engagement: 0, reach: 0 },
    linkedin: { posts: 0, engagement: 0, reach: 0 },
    threads: { posts: 0, engagement: 0, reach: 0 },
  };

  publishedPosts.forEach(post => {
    platformStats[post.platform].posts++;
    platformStats[post.platform].engagement += 
      (post.engagement?.likes || 0) + (post.engagement?.comments || 0) + (post.engagement?.shares || 0);
    platformStats[post.platform].reach += post.engagement?.reach || 0;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl p-4 text-white">
          <div className="text-3xl font-bold">{publishedPosts.length}</div>
          <div className="text-pink-100 text-sm">총 게시물</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl p-4 text-white">
          <div className="text-3xl font-bold">{totalEngagement.toLocaleString()}</div>
          <div className="text-purple-100 text-sm">총 참여</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4 text-white">
          <div className="text-3xl font-bold">{totalReach.toLocaleString()}</div>
          <div className="text-blue-100 text-sm">총 도달</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-white">
          <div className="text-3xl font-bold">{avgEngagementRate.toFixed(1)}%</div>
          <div className="text-green-100 text-sm">평균 참여율</div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">플랫폼별 성과</h3>
        <div className="space-y-3">
          {(Object.entries(platformStats) as [SocialPlatform, typeof platformStats.twitter][])
            .filter(([, stats]) => stats.posts > 0)
            .sort((a, b) => b[1].engagement - a[1].engagement)
            .map(([platform, stats]) => {
              const info = PLATFORM_INFO[platform];
              const maxEngagement = Math.max(...Object.values(platformStats).map(s => s.engagement));

              return (
                <div key={platform} className="flex items-center space-x-4">
                  <div className={`w-10 h-10 ${info.bgColor} rounded-lg flex items-center justify-center text-white`}>
                    {info.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{info.name}</span>
                      <span className="text-sm text-gray-500">{stats.posts}개 포스트</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${info.bgColor} rounded-full`}
                        style={{ width: `${(stats.engagement / maxEngagement) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>참여 {stats.engagement}</span>
                      <span>도달 {stats.reach}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Top Posts */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">인기 게시물</h3>
        <div className="space-y-3">
          {publishedPosts
            .sort((a, b) => {
              const engA = (a.engagement?.likes || 0) + (a.engagement?.comments || 0) + (a.engagement?.shares || 0);
              const engB = (b.engagement?.likes || 0) + (b.engagement?.comments || 0) + (b.engagement?.shares || 0);
              return engB - engA;
            })
            .slice(0, 3)
            .map((post, index) => {
              const platformInfo = PLATFORM_INFO[post.platform];
              const engagement = (post.engagement?.likes || 0) + (post.engagement?.comments || 0) + (post.engagement?.shares || 0);

              return (
                <div
                  key={post.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={platformInfo.color}>{platformInfo.icon}</span>
                      <span className="text-sm text-gray-500">{platformInfo.name}</span>
                    </div>
                    <p className="text-gray-900 dark:text-white text-sm truncate">
                      {post.content.substring(0, 50)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">{engagement}</div>
                    <div className="text-xs text-gray-500">참여</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default SocialMediaManager;
