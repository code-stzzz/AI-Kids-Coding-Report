'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
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
  const mountedRef = useRef(true);

  // 初始化 Supabase 客户端
  useEffect(() => {
    mountedRef.current = true;
    
    const initSupabase = async () => {
      try {
        // 从 API 获取配置
        const response = await fetch('/api/config');
        if (!response.ok) {
          if (mountedRef.current) setLoading(false);
          return;
        }
        
        const config = await response.json();
        if (!config.supabaseUrl || !config.supabaseKey) {
          if (mountedRef.current) setLoading(false);
          return;
        }

        const client = createBrowserClient(config.supabaseUrl, config.supabaseKey);
        
        if (!mountedRef.current) return;
        
        setSupabase(client);
        setConfigured(true);
        // 注册到 data-api 供 API 调用使用
        setSupabaseClient(client.auth);
      } catch (error) {
        console.error('初始化 Supabase 失败:', error);
        if (mountedRef.current) setLoading(false);
      }
    };

    initSupabase();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!mountedRef.current) return;
      
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
      // 忽略中止错误
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('获取用户信息失败:', error);
      if (mountedRef.current) setUser(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    refreshUser();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (mountedRef.current) {
        refreshUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refreshUser]);

  const signOut = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // 忽略中止错误
      }
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
