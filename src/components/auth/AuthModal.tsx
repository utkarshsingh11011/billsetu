import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  ArrowRight, 
  Sparkles, 
  X,
  AlertCircle,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { authService } from '../../services/authService';
import { User, AuthSession } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, session: AuthSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (tab === 'login') {
        const res = await authService.login(email);
        onAuthSuccess(res.user, res.session);
        onClose();
      } else {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name or company operator name.');
        }
        const res = await authService.signup(email, fullName, phone);
        onAuthSuccess(res.user, res.session);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await authService.seedQuickDemoAccount();
      onAuthSuccess(res.user, res.session);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize demo workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#0C2B62] p-5 text-white flex items-center justify-between border-b border-[#17396E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white p-1 shadow-md flex items-center justify-center">
              <img src="/logo_icon.png" alt="BillSetu Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-baseline gap-1">
                <span>Bill</span>
                <span className="text-[#19B0A0]">Setu</span>
                <span className="text-xs font-normal text-slate-300 ml-1.5">• Fleet Cloud</span>
              </h3>
              <p className="text-[11px] text-slate-300">
                {tab === 'login' ? 'Sign in to access your tenant workspace' : 'Create a fresh, isolated fleet organization'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            className={`py-3 text-center transition-colors border-b-2 ${
              tab === 'login' 
                ? 'border-[#0C2B62] text-[#0C2B62] bg-white font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); }}
            className={`py-3 text-center transition-colors border-b-2 ${
              tab === 'signup' 
                ? 'border-[#0C2B62] text-[#0C2B62] bg-white font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Fleet Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'signup' && (
            <>
              <Input
                label="Full Name / Operator Name"
                placeholder="e.g. Rajesh K. Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
                required
              />
              <Input
                label="Dispatch Mobile / WhatsApp"
                placeholder="e.g. +91 98390 12345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
              />
            </>
          )}

          <Input
            label="Work Email Address"
            type="email"
            placeholder="e.g. fleet@kashicabs.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !email.trim() || !password.trim()}
            className="w-full bg-[#0C2B62] hover:bg-[#17396E] text-white font-bold h-11 shadow-sm"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isLoading ? 'Authenticating...' : tab === 'login' ? 'Sign In to Fleet Workspace' : 'Create Organization & Continue'}
          </Button>

          {/* Quick Demo Workspace Access */}
          <div className="pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-teal-400/60 bg-teal-50/50 hover:bg-teal-50 text-xs font-semibold text-teal-800 flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#19B0A0]" />
              <span>Explore Pre-Configured Taxi Fleet Demo (Kashi Cabs)</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400 pt-1">
            Compliant with DPDP Act 2023 • 256-bit encrypted tenant storage
          </p>
        </form>

      </div>
    </div>
  );
};
