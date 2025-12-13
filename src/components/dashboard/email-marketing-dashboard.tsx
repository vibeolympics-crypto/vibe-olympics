'use client';

/**
 * 이메일 마케팅 대시보드 컴포넌트
 * 캠페인 관리, 구독자 관리, 분석 UI
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  preheader?: string;
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  stats?: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  };
  createdAt: string;
}

interface EmailList {
  id: string;
  name: string;
  description?: string;
  subscriberCount: number;
  isDefault?: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  htmlContent: string;
}

interface EmailStats {
  totalSubscribers: number;
  totalLists: number;
  totalCampaigns: number;
  sentCampaigns: number;
  scheduledCampaigns: number;
  totalEmailsSent: number;
  avgOpenRate: number;
}

// API Functions
const fetchStats = async (): Promise<EmailStats> => {
  const response = await fetch('/api/email-marketing?type=stats');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data.data;
};

const fetchCampaigns = async (): Promise<Campaign[]> => {
  const response = await fetch('/api/email-marketing?type=campaigns');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data.data;
};

const fetchLists = async (): Promise<EmailList[]> => {
  const response = await fetch('/api/email-marketing?type=lists');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data.data;
};

const fetchTemplates = async (): Promise<EmailTemplate[]> => {
  const response = await fetch('/api/email-marketing?type=templates');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data.data;
};

export function EmailMarketingDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'lists' | 'compose'>('overview');
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['email-stats'],
    queryFn: fetchStats,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: fetchCampaigns,
  });

  const { data: lists = [] } = useQuery({
    queryKey: ['email-lists'],
    queryFn: fetchLists,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: fetchTemplates,
  });

  const tabs = [
    { id: 'overview', label: '대시보드', icon: '📊' },
    { id: 'campaigns', label: '캠페인', icon: '📧' },
    { id: 'lists', label: '구독자 목록', icon: '👥' },
    { id: 'compose', label: '새 캠페인', icon: '✏️' },
  ] as const;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">이메일 마케팅</h2>
        <p className="text-blue-100 text-sm">캠페인 관리 및 구독자 분석</p>
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
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
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
          {activeTab === 'overview' && stats && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <OverviewTab stats={stats} campaigns={campaigns} />
            </motion.div>
          )}

          {activeTab === 'campaigns' && (
            <motion.div
              key="campaigns"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CampaignsTab campaigns={campaigns} />
            </motion.div>
          )}

          {activeTab === 'lists' && (
            <motion.div
              key="lists"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ListsTab lists={lists} />
            </motion.div>
          )}

          {activeTab === 'compose' && (
            <motion.div
              key="compose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ComposeTab templates={templates} lists={lists} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ stats, campaigns }: { stats: EmailStats; campaigns: Campaign[] }) {
  const recentCampaigns = campaigns.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="text-3xl font-bold">{stats.totalSubscribers.toLocaleString()}</div>
          <div className="text-blue-100 text-sm">총 구독자</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="text-3xl font-bold">{stats.totalEmailsSent.toLocaleString()}</div>
          <div className="text-green-100 text-sm">발송된 이메일</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="text-3xl font-bold">{stats.avgOpenRate.toFixed(1)}%</div>
          <div className="text-purple-100 text-sm">평균 오픈율</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="text-3xl font-bold">{stats.sentCampaigns}</div>
          <div className="text-orange-100 text-sm">발송 캠페인</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center">
          <span className="text-2xl mb-2 block">✉️</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">새 캠페인 만들기</span>
        </button>
        <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-center">
          <span className="text-2xl mb-2 block">👤</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">구독자 추가</span>
        </button>
        <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-center">
          <span className="text-2xl mb-2 block">📋</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">새 목록 만들기</span>
        </button>
      </div>

      {/* Recent Campaigns */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">최근 캠페인</h3>
        <div className="space-y-3">
          {recentCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} compact />
          ))}
        </div>
      </div>
    </div>
  );
}

// Campaigns Tab
function CampaignsTab({ campaigns }: { campaigns: Campaign[] }) {
  const [filter, setFilter] = useState<'all' | CampaignStatus>('all');

  const filteredCampaigns = campaigns.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {(['all', 'draft', 'scheduled', 'sent'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f === 'all' ? '전체' :
             f === 'draft' ? '임시저장' :
             f === 'scheduled' ? '예약됨' : '발송됨'}
          </button>
        ))}
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            캠페인이 없습니다.
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))
        )}
      </div>
    </div>
  );
}

// Campaign Card
function CampaignCard({ campaign, compact = false }: { campaign: Campaign; compact?: boolean }) {
  const getStatusBadge = (status: CampaignStatus) => {
    const styles: Record<CampaignStatus, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      sending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      sent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      paused: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    const labels: Record<CampaignStatus, string> = {
      draft: '임시저장',
      scheduled: '예약됨',
      sending: '발송 중',
      sent: '발송됨',
      paused: '일시정지',
      cancelled: '취소됨',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {campaign.name}
            </span>
            {getStatusBadge(campaign.status)}
          </div>
          <p className="text-sm text-gray-500 truncate">{campaign.subject}</p>
        </div>
        {campaign.stats && (
          <div className="text-right ml-4">
            <div className="text-sm font-medium text-green-600">{campaign.stats.openRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">오픈율</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">{campaign.name}</h3>
            {getStatusBadge(campaign.status)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{campaign.subject}</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          {campaign.sentAt
            ? `발송: ${new Date(campaign.sentAt).toLocaleDateString('ko-KR')}`
            : campaign.scheduledAt
            ? `예약: ${new Date(campaign.scheduledAt).toLocaleDateString('ko-KR')}`
            : new Date(campaign.createdAt).toLocaleDateString('ko-KR')}
        </div>
      </div>

      {campaign.stats && (
        <div className="grid grid-cols-5 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {campaign.stats.sent.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">발송</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {campaign.stats.delivered.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">전달</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {campaign.stats.openRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">오픈율</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {campaign.stats.clickRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">클릭율</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-600">
              {campaign.stats.bounceRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">반송율</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2 mt-4">
        {campaign.status === 'draft' && (
          <>
            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              편집
            </button>
            <button className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
              발송
            </button>
          </>
        )}
        {campaign.status === 'scheduled' && (
          <button className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700">
            예약 취소
          </button>
        )}
        {campaign.status === 'sent' && (
          <button className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">
            상세 보기
          </button>
        )}
      </div>
    </div>
  );
}

// Lists Tab
function ListsTab({ lists }: { lists: EmailList[] }) {
  return (
    <div className="space-y-4">
      {/* Create List Button */}
      <button className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
        <span className="font-medium text-gray-600 dark:text-gray-400">+ 새 목록 만들기</span>
      </button>

      {/* Lists */}
      <div className="grid gap-4">
        {lists.map((list) => (
          <div
            key={list.id}
            className="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{list.name}</h3>
                  {list.isDefault && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full">
                      기본
                    </span>
                  )}
                </div>
                {list.description && (
                  <p className="text-sm text-gray-500 mt-1">{list.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {list.subscriberCount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">구독자</div>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                구독자 보기
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                내보내기
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                설정
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compose Tab
function ComposeTab({ templates, lists }: { templates: EmailTemplate[]; lists: EmailList[] }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');

  const toggleList = (listId: string) => {
    setSelectedLists(prev =>
      prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    );
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template.id);
    setSubject(template.subject);
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Select Template */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">1. 템플릿 선택</h3>
        <div className="grid grid-cols-2 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`p-4 border rounded-xl text-left transition-all ${
                selectedTemplate === template.id
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">
                  {template.category === 'welcome' ? '👋' :
                   template.category === 'newsletter' ? '📰' :
                   template.category === 'promotional' ? '🎁' :
                   template.category === 'cart-recovery' ? '🛒' : '✉️'}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{template.name}</span>
              </div>
              <p className="text-sm text-gray-500">{template.subject}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select Recipients */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">2. 수신자 선택</h3>
        <div className="space-y-2">
          {lists.map((list) => (
            <label
              key={list.id}
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedLists.includes(list.id)
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedLists.includes(list.id)}
                  onChange={() => toggleList(list.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{list.name}</span>
                  {list.description && (
                    <p className="text-sm text-gray-500">{list.description}</p>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-500">{list.subscriberCount.toLocaleString()}명</span>
            </label>
          ))}
        </div>
      </div>

      {/* Step 3: Campaign Details */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">3. 캠페인 세부 정보</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              제목
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="이메일 제목을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              미리보기 텍스트 (선택)
            </label>
            <input
              type="text"
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              placeholder="받은편지함에서 제목 옆에 표시될 텍스트"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {selectedTemplate && selectedLists.length > 0 && subject && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">캠페인 요약</h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>• 템플릿: {templates.find(t => t.id === selectedTemplate)?.name}</p>
            <p>• 수신자: {selectedLists.reduce((sum, id) => {
              const list = lists.find(l => l.id === id);
              return sum + (list?.subscriberCount || 0);
            }, 0).toLocaleString()}명</p>
            <p>• 제목: {subject}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          disabled={!selectedTemplate || selectedLists.length === 0 || !subject}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          캠페인 저장
        </button>
        <button
          disabled={!selectedTemplate || selectedLists.length === 0 || !subject}
          className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          바로 발송
        </button>
        <button
          disabled={!selectedTemplate || selectedLists.length === 0 || !subject}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          예약
        </button>
      </div>
    </div>
  );
}

export default EmailMarketingDashboard;
