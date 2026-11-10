import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { showToast } from '../lib/toast';
import { validators, getPasswordStrength } from '../lib/validation';
import { FormInput } from '../components/FormInput';
import { Zap, Check, User, Mail, ArrowRight, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PERKS = [
  { icon: '🆓', text: 'Free forever plan available' },
  { icon: '💳', text: 'No credit card required' },
  { icon: '🔗', text: 'Connect all social accounts' },
  { icon: '🤖', text: 'AI-powered content generation' },
  { icon: '📊', text: 'Real-time analytics & insights' },
  { icon: '🌍', text: 'Publish to 6 platforms at once' },
];

const PLANS = [
  { name: 'Free',        price: '$0',  color: '#6b7280' },
  { name: 'Starter',     price: '$9',  color: '#3b82f6' },
  { name: 'Creator Pro', price: '$19', color: '#8b5cf6' },
  { name: 'Business',    price: '$49', color: '#f59e0b' },
];

export default function Register() {
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
  const [errors,   setErrors]   = useState({});
  const [touched,  setTouched]  = useState({});
  const [loading,  setLoading]  = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const passwordStrength = getPasswordStrength(formData.password);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
  };

  const validateField = (name, value) => {
    let error = null;
    if (name === 'full_name') error = validators.required(value, 'Full name') || validators.minLength(value, 2, 'Full name');
    if (name === 'email')     error = validators.email(value);
    if (name === 'password')  error = validators.password(value, { minLength: 8 });
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameError     = validators.required(formData.full_name, 'Full name') || validators.minLength(formData.full_name, 2, 'Full name');
    const emailError    = validators.email(formData.email);
    const passwordError = validators.password(formData.password, { minLength: 8 });
    if (nameError || emailError || passwordError) {
      setErrors({ full_name: nameError, email: emailError, password: passwordError });
      setTouched({ full_name: true, email: true, password: true });
      return;
    }
    setLoading(true);
    try {
      await register(formData.full_name, formData.email, formData.password);
      showToast.success("Account created! Let's get started 🚀");
      navigate('/quick-start');
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = { red: '#ef4444', yellow: '#f59e0b', blue: '#3b82f6', green: '#10b981' };
  const strengthColor  = strengthColors[passwordStrength?.color] || '#2d3748';

  return (
    <div className="flex min-h-[calc(100vh-64px)]">

      {/* ══ LEFT — Branding Panel ══════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-center p-12 overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #0d1021 0%, #0f1117 60%, #120d1a 100%)' }}>

        {/* Orb decorations */}
        <div className="absolute top-[-60px] right-[-60px] w-[350px] h-[350px] rounded-full opacity-20 animate-blob"
             style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', animationDuration: '12s' }} />
        <div className="absolute bottom-[-40px] left-[-40px] w-[280px] h-[280px] rounded-full opacity-15 animate-blob"
             style={{ background: 'radial-gradient(circle, #00d4aa 0%, transparent 70%)', animationDuration: '16s', animationDelay: '-6s' }} />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.025]"
             style={{
               backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
               backgroundSize: '28px 28px',
             }} />

        <div className="relative">
          {/* Logo */}
          <div className={`flex items-center gap-3 mb-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#00d4aa] to-emerald-500 blur-md opacity-40" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-[#00d4aa] to-emerald-500 rounded-xl flex items-center justify-center shadow-glow-teal-sm">
                <Zap size={20} className="text-[#0a0d14]" strokeWidth={2.5} />
              </div>
            </div>
            <span className="text-xl font-black text-white tracking-tight">Publift</span>
          </div>

          {/* Headline */}
          <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
               style={{ transitionDelay: '0.1s' }}>
            <div className="inline-flex items-center gap-2 bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-full px-3 py-1 mb-5">
              <Sparkles size={12} className="text-[#8b5cf6]" />
              <span className="text-xs font-semibold text-[#8b5cf6]">Start free in 60 seconds</span>
            </div>
            <h2 className="text-4xl font-black text-white leading-[1.1] tracking-tight mb-4">
              Everything you need<br />
              <span className="gradient-text">to grow on social</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Join thousands of creators and businesses automating their social media with AI.
            </p>
          </div>

          {/* Perks */}
          <div className={`space-y-3 mb-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
               style={{ transitionDelay: '0.2s' }}>
            {PERKS.map(({ icon, text }, i) => (
              <div
                key={text}
                className="flex items-center gap-3 group animate-fade-in-up"
                style={{ animationDelay: `${0.3 + i * 0.05}s` }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                     style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.15)' }}>
                  <Check size={13} className="text-[#00d4aa]" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-slate-300 font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Plans preview */}
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
               style={{ transitionDelay: '0.4s' }}>
            <p className="text-xs text-gray-600 font-medium mb-3 uppercase tracking-widest">Available plans</p>
            <div className="flex gap-2">
              {PLANS.map(({ name, price, color }) => (
                <div key={name}
                     className="flex-1 rounded-xl p-2.5 text-center transition-all duration-200 hover:scale-105"
                     style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22` }}>
                  <div className="text-xs font-bold mb-0.5" style={{ color }}>{price}</div>
                  <div className="text-[9px] text-gray-600 font-medium">{name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Register Form ═════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 relative"
           style={{ background: '#0a0d14' }}>

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139,92,246,0.04) 0%, transparent 70%)' }} />

        <div className={`relative w-full max-w-[420px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
             style={{ transitionDelay: '0.15s' }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <Link to="/home" className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#00d4aa] to-emerald-500 blur-md opacity-40" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-[#00d4aa] to-emerald-500 rounded-xl flex items-center justify-center shadow-glow-teal-sm">
                  <Zap size={20} className="text-[#0a0d14]" strokeWidth={2.5} />
                </div>
              </div>
              <span className="text-2xl font-black text-white tracking-tight">Publift</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Create account</h2>
            <p className="text-gray-500 mt-2 text-sm">Start free — no credit card needed</p>
          </div>

          {/* Google Button */}
          <button
            onClick={() => window.location.href = `${API_URL}/auth/google`}
            className="group w-full flex items-center justify-center gap-3 rounded-xl py-3.5 font-semibold text-sm text-gray-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
            <ArrowRight size={15} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ml-auto" />
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs font-medium text-gray-600">or sign up with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Full name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.full_name}
              touched={touched.full_name}
              placeholder="John Doe"
              required
              icon={User}
            />
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
              <FormInput
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password}
                touched={touched.password}
                placeholder="Min 8 characters"
                required
                helpText="Use uppercase, lowercase, and numbers"
              />
              {/* Password strength bar */}
              {formData.password && passwordStrength?.strength > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${passwordStrength.strength}%`, background: strengthColor }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: strengthColor }} />
                    {passwordStrength.label} password
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer w-full relative py-3.5 rounded-xl text-sm font-bold text-[#0a0d14] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2 shadow-glow-teal-sm hover:shadow-glow-teal overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #00d4aa 0%, #10b981 50%, #00d4aa 100%)', backgroundSize: '200% 200%' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create free account <ArrowRight size={16} />
                </span>
              )}
            </button>

            <p className="text-xs text-gray-600 text-center">
              By creating an account you agree to our{' '}
              <span className="text-[#00d4aa] cursor-pointer hover:underline">Terms</span>
              {' & '}
              <span className="text-[#00d4aa] cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#00d4aa] font-semibold hover:text-emerald-400 transition-colors">
              Sign in →
            </Link>
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {['🔒 Secure', '⚡ Free plan', '🌍 6 Platforms'].map((item) => (
              <span key={item} className="text-xs text-gray-600 font-medium">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
