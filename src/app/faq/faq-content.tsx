'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  HelpCircle, 
  ShoppingCart, 
  Store, 
  GraduationCap, 
  Users, 
  User, 
  CreditCard, 
  Scale,
  Mail,
  ExternalLink
} from 'lucide-react';
import { useLocale } from 'next-intl';
import Link from 'next/link';

// Import FAQ data
import faqKo from '@/data/faq.json';
import faqEn from '@/data/faq.en.json';

type FAQCategory = 'general' | 'buyer' | 'seller' | 'education' | 'community' | 'account' | 'payment' | 'legal';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  relatedActions: string[];
  priority: number;
}

const categoryIcons: Record<FAQCategory, React.ReactNode> = {
  general: <HelpCircle className="w-5 h-5" />,
  buyer: <ShoppingCart className="w-5 h-5" />,
  seller: <Store className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />,
  community: <Users className="w-5 h-5" />,
  account: <User className="w-5 h-5" />,
  payment: <CreditCard className="w-5 h-5" />,
  legal: <Scale className="w-5 h-5" />,
};

const categoryColors: Record<FAQCategory, string> = {
  general: 'bg-gray-100 text-gray-700 border-gray-200',
  buyer: 'bg-blue-100 text-blue-700 border-blue-200',
  seller: 'bg-green-100 text-green-700 border-green-200',
  education: 'bg-purple-100 text-purple-700 border-purple-200',
  community: 'bg-orange-100 text-orange-700 border-orange-200',
  account: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  payment: 'bg-pink-100 text-pink-700 border-pink-200',
  legal: 'bg-amber-100 text-amber-700 border-amber-200',
};

// Related action routes mapping
const actionRoutes: Record<string, string> = {
  '마켓플레이스 둘러보기': '/marketplace',
  'Browse Marketplace': '/marketplace',
  '교육 센터 방문': '/education',
  'Visit Education Center': '/education',
  '회원가입': '/auth/signup',
  'Sign Up': '/auth/signup',
  '로그인': '/auth/login',
  'Login': '/auth/login',
  '카테고리 보기': '/marketplace',
  'View Categories': '/marketplace',
  '인기 상품 보기': '/marketplace',
  'Popular Products': '/marketplace',
  '마켓플레이스': '/marketplace',
  'Marketplace': '/marketplace',
  '구매 내역': '/dashboard/purchases',
  'Purchases': '/dashboard/purchases',
  '문의하기': 'mailto:support@vibeolympics.com',
  'Contact Support': 'mailto:support@vibeolympics.com',
  '위시리스트': '/dashboard/wishlist',
  'Wishlist': '/dashboard/wishlist',
  '대시보드': '/dashboard',
  'Dashboard': '/dashboard',
  '설정': '/dashboard/settings',
  'Settings': '/dashboard/settings',
  '내 상품': '/dashboard/products',
  'My Products': '/dashboard/products',
  '상품 등록': '/dashboard/products/new',
  'Add Product': '/dashboard/products/new',
  '분석': '/dashboard/analytics',
  'Analytics': '/dashboard/analytics',
  '교육 센터': '/education',
  'Education Center': '/education',
  '튜토리얼': '/education',
  'Tutorials': '/education',
  '콘텐츠 작성': '/education',
  'Create Content': '/education',
  '커뮤니티': '/community',
  'Community': '/community',
  '글쓰기': '/community',
  'Write Post': '/community',
  '비밀번호 찾기': '/auth/login',
  'Forgot Password': '/auth/login',
  '개인정보처리방침': '/privacy',
  'Privacy Policy': '/privacy',
  '이용약관': '/terms',
  'Terms of Service': '/terms',
};

function AccordionItem({ 
  item, 
  isOpen, 
  onToggle 
}: { 
  item: FAQItem; 
  isOpen: boolean; 
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">{item.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pb-4 pt-2 border-t border-gray-100">
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                {item.answer}
              </p>
              
              {item.relatedActions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.relatedActions.map((action) => {
                    const route = actionRoutes[action];
                    const isExternal = route?.startsWith('mailto:');
                    
                    if (!route) return null;
                    
                    return isExternal ? (
                      <a
                        key={action}
                        href={route}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {action}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <Link
                        key={action}
                        href={route}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {action}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQContent() {
  const locale = useLocale();
  const faqData = locale === 'ko' ? faqKo.faq : faqEn.faq;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'all'>('all');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  
  const categories = Object.keys(faqData.categories) as FAQCategory[];
  
  // Filter and search FAQ items
  const filteredItems = useMemo(() => {
    const allItems: { category: FAQCategory; item: FAQItem }[] = [];
    
    categories.forEach((category) => {
      const items = faqData.items[category] as FAQItem[];
      items.forEach((item) => {
        allItems.push({ category, item });
      });
    });
    
    return allItems.filter(({ category, item }) => {
      // Category filter
      if (selectedCategory !== 'all' && category !== selectedCategory) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
        );
      }
      
      return true;
    }).sort((a, b) => a.item.priority - b.item.priority);
  }, [categories, faqData.items, selectedCategory, searchQuery]);
  
  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  // Group filtered items by category for display
  const groupedItems = useMemo(() => {
    const groups: Record<FAQCategory, FAQItem[]> = {
      general: [],
      buyer: [],
      seller: [],
      education: [],
      community: [],
      account: [],
      payment: [],
      legal: [],
    };
    
    filteredItems.forEach(({ category, item }) => {
      groups[category].push(item);
    });
    
    return groups;
  }, [filteredItems]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HelpCircle className="w-16 h-16 mx-auto text-white/80 mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">
              {faqData.title}
            </h1>
            <p className="text-xl text-white/80 mb-8">
              {faqData.description}
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={faqData.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-0 shadow-lg focus:ring-2 focus:ring-blue-300 text-gray-900 placeholder-gray-500"
              />
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Category Filter */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {locale === 'ko' ? '전체' : 'All'}
            </button>
            
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedCategory === category
                    ? categoryColors[category]
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {categoryIcons[category]}
                {faqData.categories[category]}
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">{faqData.noResults}</p>
            </motion.div>
          ) : selectedCategory === 'all' ? (
            // Show grouped by category
            <div className="space-y-12">
              {categories.map((category) => {
                const items = groupedItems[category];
                if (items.length === 0) return null;
                
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2 rounded-lg ${categoryColors[category]}`}>
                        {categoryIcons[category]}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {faqData.categories[category]}
                      </h2>
                      <span className="text-sm text-gray-500">
                        ({items.length})
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {items.map((item) => (
                        <AccordionItem
                          key={item.id}
                          item={item}
                          isOpen={openItems.has(item.id)}
                          onToggle={() => toggleItem(item.id)}
                        />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // Show single category
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${categoryColors[selectedCategory]}`}>
                  {categoryIcons[selectedCategory]}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {faqData.categories[selectedCategory]}
                </h2>
                <span className="text-sm text-gray-500">
                  ({filteredItems.length})
                </span>
              </div>
              
              <div className="space-y-3">
                {filteredItems.map(({ item }) => (
                  <AccordionItem
                    key={item.id}
                    item={item}
                    isOpen={openItems.has(item.id)}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>
      
      {/* Contact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Mail className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {faqData.contact.title}
            </h2>
            <p className="text-gray-600 mb-6">
              {faqData.contact.description}
            </p>
            
            <a
              href={`mailto:${faqData.contact.email}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Mail className="w-5 h-5" />
              {faqData.contact.email}
            </a>
            
            <p className="mt-4 text-sm text-gray-500">
              {faqData.contact.responseTime}
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Quick Links */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            {locale === 'ko' ? '빠른 링크' : 'Quick Links'}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/marketplace"
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <ShoppingCart className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                {locale === 'ko' ? '마켓플레이스' : 'Marketplace'}
              </span>
            </Link>
            
            <Link
              href="/education"
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <GraduationCap className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                {locale === 'ko' ? '교육 센터' : 'Education'}
              </span>
            </Link>
            
            <Link
              href="/community"
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              <Users className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                {locale === 'ko' ? '커뮤니티' : 'Community'}
              </span>
            </Link>
            
            <Link
              href="/dashboard"
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
            >
              <User className="w-8 h-8 text-cyan-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                {locale === 'ko' ? '대시보드' : 'Dashboard'}
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
