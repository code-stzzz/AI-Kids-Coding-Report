'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { setSupabaseClient } from '@/lib/data-api';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  // 初始化 Supabase 客户端
  useEffect(() => {
    const initSupabase = async () => {
      try {
        // 从 API 获取配置
        const response = await fetch('/api/config');
        if (!response.ok) {
          setLoading(false);
          return;
        }
        
        const config = await response.json();
        if (!config.supabaseUrl || !config.supabaseKey) {
          setLoading(false);
          return;
        }

        const client = createBrowserClient(config.supabaseUrl, config.supabaseKey);
        setSupabase(client);
        setConfigured(true);
        // 注册到 data-api 供 API 调用使用
        setSupabaseClient(client.auth);
      } catch (error) {
        console.error('初始化 Supabase 失败:', error);
        setLoading(false);
      }
    };

    initSupabase();
  }, []);

  const refreshUser = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '用户',
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      return;
    }

    refreshUser();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    window.location.href = '/auth';
  };

  return (
    <UserContext.Provider value={{ user, loading, configured, signOut, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
