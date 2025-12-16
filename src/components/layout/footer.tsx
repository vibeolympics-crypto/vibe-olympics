import Link from "next/link";
import { Github, Twitter, Mail, Rss } from "lucide-react";
import { AdSlot } from "@/components/ads";

const footerLinks = {
  platform: [
    { name: "판도라 샵", href: "/marketplace" },
    { name: "교육 센터", href: "/education" },
    { name: "커뮤니티", href: "/community" },
    { name: "가격 정책", href: "/pricing" },
  ],
  support: [
    { name: "FAQ", href: "/faq" },
    { name: "문의하기", href: "/contact" },
    { name: "가이드", href: "/guide" },
    { name: "API 문서", href: "/docs" },
  ],
  legal: [
    { name: "이용약관", href: "/terms" },
    { name: "개인정보처리방침", href: "/privacy" },
    { name: "환불정책", href: "/refund" },
  ],
  feeds: [
    { name: "RSS 피드", href: "/api/feed/rss" },
    { name: "Atom 피드", href: "/api/feed/atom" },
  ],
};

const socialLinks = [
  { name: "GitHub", href: "https://github.com", icon: Github },
  { name: "Twitter", href: "https://twitter.com", icon: Twitter },
  { name: "Email", href: "mailto:contact@vibeolympics.com", icon: Mail },
  { name: "RSS", href: "/api/feed/rss", icon: Rss },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--bg-border)] bg-[var(--bg-surface)]">
      {/* 광고 영역 - 푸터 상단 */}
      <div className="container-app py-6 border-b border-[var(--bg-border)]">
        <div className="flex justify-center">
          <AdSlot 
            type="banner-bottom" 
            provider="placeholder"
            className="max-w-[728px]"
          />
        </div>
      </div>

      <div className="container-app py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] via-[var(--accent-violet)] to-[var(--accent-magenta)] flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)]">
                Vibe Olympics
              </span>
            </Link>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              Create your idea<br />
              아이디어를 현실로, 지식을 가치로
            </p>
            <div className="flex gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--primary)] hover:bg-[var(--bg-border)] transition-colors"
                  aria-label={item.name}
                >
                  <item.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              플랫폼
            </h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              지원
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              법적 고지
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-[var(--bg-border)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[var(--text-disabled)]">
              © 2025 Vibe Olympics. All rights reserved.
            </p>
            <p className="text-sm text-[var(--text-disabled)]">
              Made with ❤️ for creators
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
