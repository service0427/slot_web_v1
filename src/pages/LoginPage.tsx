import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!email || !password) {
        toast({
          title: '입력 오류',
          description: '이메일과 비밀번호를 모두 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }

      const response = await login({
        email,
        password
      });
      
      // 역할에 따라 적절한 페이지로 이동
      if (response.user?.role === 'admin' || response.user?.level === 1) {
        navigate('/admin');
      } else if (response.user?.role === 'distributor' || response.user?.level === 2) {
        navigate('/admin');
      } else if (response.user?.role === 'agency' || response.user?.level === 3) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: '로그인 실패',
        description: error.message || '이메일 또는 비밀번호를 확인해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* 로고 */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">슬롯 매니저</h1>
            <p className="text-white/70">프리미엄 슬롯 관리 시스템</p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-12 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent backdrop-blur-sm"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-12 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent backdrop-blur-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-white/30"
                />
                <span className="ml-2 text-white/70 text-sm">로그인 상태 유지</span>
              </label>
              <a href="#" className="text-white/70 text-sm hover:text-white transition-colors">
                비밀번호 찾기
              </a>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-purple-600 hover:bg-white/90 rounded-xl py-3 font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  로그인 중...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  로그인
                  <ArrowRight className="ml-2 w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          {/* 추가 옵션 */}
          <div className="mt-8 text-center">
            <p className="text-white/70 text-sm">
              아직 계정이 없으신가요?{' '}
              <a href="#" className="text-white font-semibold hover:underline">
                회원가입
              </a>
            </p>
          </div>

          {/* 소셜 로그인 */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            <button className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <span className="text-white text-xl">G</span>
            </button>
            <button className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <span className="text-white text-xl">N</span>
            </button>
            <button className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <span className="text-white text-xl">K</span>
            </button>
          </div>
        </div>

        {/* 데모 안내 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
        >
          <div className="space-y-2">
            <p className="text-white/80 text-sm text-center font-medium">
              🎯 테스트 계정 안내
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-white/70">
                <span className="font-semibold">관리자:</span> admin@test.com
              </div>
              <div className="text-white/70">
                <span className="font-semibold">비밀번호:</span> admin123
              </div>
              <div className="text-white/70">
                <span className="font-semibold">사용자:</span> user@test.com
              </div>
              <div className="text-white/70">
                <span className="font-semibold">비밀번호:</span> user123
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};