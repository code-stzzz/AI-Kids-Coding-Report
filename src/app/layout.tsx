import type { Metadata } from 'next';
import './globals.css';
import { UserProvider } from '@/components/providers/UserProvider';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: {
    default: '少儿编程AI学习报告生成助手',
    template: '%s | 少儿编程AI学习报告生成助手',
  },
  description: '为少儿编程老师打造的轻量化学习报告生成工具，支持Python/Scratch/C++，AI自动生成专属文案，一键导出高清海报',
  keywords: ['少儿编程', '学习报告', 'AI生成', 'Python', 'Scratch', 'C++', '教育'],
  authors: [{ name: '少儿编程教育团队' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <UserProvider>
          <Header />
          <main>{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}
