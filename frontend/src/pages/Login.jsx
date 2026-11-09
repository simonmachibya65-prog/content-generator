import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { showToast } from '../lib/toast';
import { validators } from '../lib/validation';
import { FormInput } from '../components/FormInput';
import { Button } from '../components/Button';
import { Zap, TrendingUp, Users, Globe, Mail } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FEATURES = [
  { icon: Zap, label: 'AI Content Generation', color: 'text-yellow-400' },
  { icon: Globe, label: '6 Social Platforms', color: 'text-blue-400' },
  { icon: TrendingUp, label: 'Auto-Publish & Grow', color: 'text-green-400' },
  { icon: Users, label: 'Team Collaboration', color: 'text-purple-400' }
];

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'google_auth_failed') showToast.error('Google authentication failed');
    if (error === 'authentication_failed') showToast.error('Authentication failed. Try again.');
  }, [searchParams]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const validateField = (name, value) => {
    let error = null;
    if (name === 'email') error = validators.email(value);
    if (name === 'password') error = validators.required(value, 'Password');
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const emailError = validators.email(formData.email);
    const passwordError = validators.required(formData.password, 'Password');
    
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      setTouched({ email: true, password: true });
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      showToast.success('Welcome back! 👋');
      navigate('/');
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-[calc(100vh-64px)]">
      {/* ── Left Panel (Branding) ─────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] auth-bg flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-3xl" />

        {/* Logo */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-emerald-500 rounded-xl flex items-center justify-center shadow-glow-teal">
              <Zap size={22} className="text-dark-base" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Publift</span>
          </div>
        </div>

        {/* Hero Text */}
        <div className="space-y-8">
          <div>
            <h1 className="text-5xl font-black text-white leading-tight">
              Create once.<br />
              <span className="gradient-text">Publish everywhere.</span><br />
              Grow intelligently.
            </h1>
            <p className="text-slate-400 text-lg mt-4 leading-relaxed">
              AI-powered social media management that works 24/7. 
              Set it up in 5 minutes and let automation do the rest.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {FEATURES.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 glass-dark px-4 py-2.5 rounded-xl">
                <Icon size={16} className={color} />
                <span className="text-sm font-medium text-slate-300">{label}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {['🧑‍💻','👩‍🎨','👨‍💼','👩‍💻','🧑‍🎤'].map((emoji, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-sm">
                  {emoji}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Join thousands of creators</p>
              <p className="text-slate-500 text-xs">Managing 50,000+ social accounts</p>
            </div>
          </div>
        </div>

        {/* Platform icons */}
        <div className="flex items-center gap-3">
          {['🎵','▶️','𝕏','📸','📘','💼'].map((icon, i) => (
            <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg animate-float" style={{ animationDelay: `${i * 0.2}s` }}>
              {icon}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel (Form) ────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-dark-base">
        <div className="w-full max-w-[420px] animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 bg-gradient-to-br from-accent-primary to-emerald-500 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-dark-base" />
            </div>
            <span className="text-xl font-bold text-white">Publift</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Welcome back</h2>
            <p className="text-gray-400 mt-2">Sign in to your dashboard</p>
          </div>

          {/* Google Button */}
          <button
            onClick={() => window.location.href = `${API_URL}/auth/google`}
            className="w-full flex items-center justify-center gap-3 bg-dark-card border border-dark-border hover:border-dark-border-light hover:bg-dark-hover text-gray-200 font-semibold py-3.5 rounded-xl transition-all shadow-sm mb-5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider mb-5">or sign in with email</div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              touched={touched.email}
              placeholder="you@example.com"
              required
              icon={Mail}
            />

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <button type="button" className="text-xs text-accent-primary font-medium hover:underline">
                  Forgot password?
                </button>
              </div>
              <FormInput
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password}
                touched={touched.password}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent-primary font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
