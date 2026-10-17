import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Car,
  QrCode,
  FileText,
  KeyRound,
  Check
} from 'lucide-react';
import { authService } from '../../services/authService';
import { User, AuthSession } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';

export interface WelcomeAuthScreenProps {
  onAuthSuccess: (user: User, session: AuthSession) => void;
}

export const WelcomeAuthScreen: React.FC<WelcomeAuthScreenProps> = ({
  onAuthSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);

  // Signup fields
  const [fullName, setFullName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPhone, setSignupPhone] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!loginIdentifier.trim()) {
        throw new Error('Please enter your registered email address or mobile number.');
      }

      if (loginMethod === 'otp') {
        if (!isOtpSent) {
          // Send simulated 6-digit OTP
          setIsOtpSent(true);
          setOtpMessage(`A 6-digit verification code has been sent to ${loginIdentifier}. (Use code: 123456)`);
          setIsLoading(false);
          return;
        } else {
          if (otpCode !== '123456' && otpCode.length !== 6) {
            throw new Error('Invalid OTP. Please enter 123456 or a valid 6-digit code.');
          }
        }
      }

      // If user exists, log in; if not found, notify cleanly
      const res = await authService.login(loginIdentifier);
      onAuthSuccess(res.user, res.session);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!fullName.trim()) {
        throw new Error('Please enter your full name or fleet company operator name.');
      }
      if (!signupEmail.trim()) {
        throw new Error('Please provide an email address for your organization.');
      }

      const res = await authService.signup(signupEmail, fullName, signupPhone);
      onAuthSuccess(res.user, res.session);
    } catch (err: any) {
      setError(err?.message || 'Failed to create your fleet account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-Click Fleet Operator Demo
  const handleDemoFleetLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await authService.seedQuickDemoAccount();
      onAuthSuccess(res.user, res.session);
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize demo fleet workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0A1A3A] to-[#0C2B62] flex flex-col justify-between text-white font-sans selection:bg-[#19B0A0] selection:text-white">
      
      {/* Top Brand Banner */}
      <header className="px-6 py-5 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white p-1.5 shadow-lg flex items-center justify-center border border-white/20">
            <img src="/logo_icon.png" alt="BillSetu Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">Bill</span>
              <span className="text-xl font-black tracking-tight text-[#19B0A0]">Setu</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-white/10 text-teal-300 px-2 py-0.5 rounded-full border border-white/10">
                Fleet SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">Smart GST Billing & Duty Slip Scanner for Travel & Business</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs text-slate-300">
          <span className="flex items-center gap-1.5 text-teal-300">
            <ShieldCheck className="w-4 h-4 text-[#19B0A0]" />
            GSTN Rules 2017 Compliant
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <QrCode className="w-4 h-4 text-[#19B0A0]" />
            Dynamic NPCI UPI QR
          </span>
        </div>
      </header>

      {/* Main Authentication Card Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-fadeIn">
          
          {/* Card Header with Mode Switcher */}
          <div className="bg-[#0C2B62] p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#19B0A0]/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
            
            <div className="relative z-10 space-y-1">
              <h2 className="text-2xl font-black tracking-tight">
                {authMode === 'login' ? 'Welcome Back' : 'Create Fleet Account'}
              </h2>
              <p className="text-xs text-slate-200 font-medium">
                {authMode === 'login' 
                  ? 'Sign in to access your company bills and duty slips' 
                  : 'Start billing in under 60 seconds with auto-GSTIN lookup'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="mt-5 grid grid-cols-2 p-1 bg-white/10 backdrop-blur-xs rounded-xl border border-white/15 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                  setOtpMessage(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white text-[#0C2B62] shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setError(null);
                  setOtpMessage(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-white text-[#0C2B62] shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                New Registration
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-7 space-y-5">
            
            {/* Error Notification */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            )}

            {/* OTP Status Notification */}
            {otpMessage && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-xs text-teal-800">
                <CheckCircle2 className="w-4 h-4 text-[#19B0A0] shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{otpMessage}</div>
              </div>
            )}

            {/* ================= LOGIN FORM ================= */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Login Method Toggle: Password vs OTP */}
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="font-semibold text-slate-700">Login Method:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('password');
                        setIsOtpSent(false);
                        setOtpMessage(null);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        loginMethod === 'password'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('otp');
                        setError(null);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        loginMethod === 'otp'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Mobile OTP
                    </button>
                  </div>
                </div>

                <Input
                  label={loginMethod === 'otp' ? 'Registered Mobile Number or Email' : 'Email Address'}
                  type={loginMethod === 'otp' ? 'text' : 'email'}
                  placeholder={loginMethod === 'otp' ? 'e.g. 9839012345 or operator@kashicabs.in' : 'e.g. operator@kashicabs.in'}
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  leftIcon={loginMethod === 'otp' ? <Phone className="w-4 h-4 text-slate-400" /> : <Mail className="w-4 h-4 text-slate-400" />}
                  required
                  autoFocus
                />

                {loginMethod === 'password' ? (
                  <Input
                    label="Account Password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                    required
                  />
                ) : (
                  isOtpSent && (
                    <div className="space-y-1">
                      <Input
                        label="6-Digit SMS Verification OTP"
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.trim())}
                        leftIcon={<KeyRound className="w-4 h-4 text-slate-400" />}
                        className="font-mono text-center tracking-widest text-lg font-bold"
                        required
                        autoFocus
                      />
                      <p className="text-[11px] text-slate-500 flex justify-between">
                        <span>Didn't receive code?</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setOtpCode('');
                            setIsOtpSent(true);
                            setOtpMessage(`New verification code sent to ${loginIdentifier}. (Use: 123456)`);
                          }}
                          className="text-[#0C2B62] font-semibold hover:underline"
                        >
                          Resend OTP
                        </button>
                      </p>
                    </div>
                  )
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading}
                  className="w-full bg-[#0C2B62] hover:bg-[#17396E] text-white font-bold h-11 shadow-md mt-2"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isLoading 
                    ? 'Verifying Credentials...' 
                    : (loginMethod === 'otp' && !isOtpSent ? 'Send Login OTP' : 'Sign In to Workspace')}
                </Button>
              </form>
            )}

            {/* ================= SIGNUP FORM ================= */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-3.5">
                <Input
                  label="Fleet Operator / Business Owner Name"
                  placeholder="e.g. Rajesh Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
                  required
                  autoFocus
                />

                <Input
                  label="Business Email Address"
                  type="email"
                  placeholder="e.g. info@sharmatravels.in"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  required
                />

                <Input
                  label="Mobile Number (For Billing Alerts & WhatsApp)"
                  type="tel"
                  placeholder="e.g. +91 98390 12345"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                  required
                />

                <Input
                  label="Create Secure Password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  required
                />

                <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-[11px] text-teal-800 leading-tight">
                  <span className="font-bold">Next Step:</span> You will be guided through a 60-second business setup with instant 15-digit GSTIN lookup and UPI QR configuration.
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading}
                  className="w-full bg-[#19B0A0] hover:bg-[#0E8478] text-white font-bold h-11 shadow-md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isLoading ? 'Creating Your Account...' : 'Continue to Business Setup'}
                </Button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                  Or instant review
                </span>
              </div>
            </div>

            {/* 1-Click Quick Demo Login Button */}
            <button
              type="button"
              onClick={handleDemoFleetLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Car className="w-4 h-4 text-[#0C2B62]" />
              <span>⚡ 1-Click Demo Fleet Login (Kashi Travels & Fleet)</span>
            </button>

          </div>

          {/* Card Footer Trust Statement */}
          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#19B0A0]" />
              Multi-Tenant Isolated
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium">
              <Check className="w-3.5 h-3.5 text-[#19B0A0]" />
              Rule 33 Pure Agent Tolls
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 max-w-7xl w-full mx-auto text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/10">
        <div>
          <span>© {new Date().getFullYear()} Bill Setu Technologies. Built for India's Cab, Taxi & Fleet Economy.</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <span>Security & GST Standard</span>
          <span>•</span>
          <span>Terms & Conditions</span>
          <span>•</span>
          <span>Support: +91 98390 12345</span>
        </div>
      </footer>

    </div>
  );
};
