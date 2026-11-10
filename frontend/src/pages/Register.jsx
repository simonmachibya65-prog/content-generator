import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { showToast } from '../lib/toast';
import { validators, getPasswordStrength } from '../lib/validation';
import { FormInput } from '../components/FormInput';
import { Zap, Check, User, Mail, ArrowRight, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PERKS = [
  'Free forever plan available',
  'No credit card required',
  'Connect all social accounts',
  'AI-powered content generation',
  'Real-time analytics & insights',
  'Publish to 6 platforms at once',
];

export default function Register() {
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const passwordStrength = getPasswordStrength(formData.password);

  useEffect(() => {}, []);

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
    if (name === 'email') error = validators.email(value);
    if (name === 'password') error = validators.password(value, { minLength: 8 });
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameError = validators.required(formData.full_name, 'Full name') || validators.minLength(formData.full_name, 2, 'Full name');
    const emailError = validators.email(formData.email);
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

  const strengthColors = { red: '#ef4444', yellow: '#f59e0b', blue: '#3b82f6', green: '#16a34a' };
  const strengthColor = strengthColors[passwordStrength?.color] || '#d6d3d1';

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-stone-50">
      {/* ══ LEFT — Branding Panel ══════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-center p-12 bg-gradient-to-br from-green-50 via-stone-50 to-emerald-50">
        <div className="max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <Zap size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-stone-900">Publift</span>
          </Link>

          {/* Headline */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-3 py-1 mb-5">
              <Sparkles size={12} className="text-green-600" />
              <span className="text-xs font-semibold text-green-700">Start free in 60 seconds</span>
            </div>
            <h2 className="text-4xl font-bold text-stone-900 leading-tight mb-4">
              Everything you need<br />
              <span className="text-green-600">to grow on social</span>
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed">
              Join thousands of creators and businesses automating their social media with AI.
            </p>
          </div>

          {/* Perks */}
          <div className="space-y-3">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check size={13} className="text-green-600" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-stone-700 font-medium">{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Register Form ═════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Zap size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold text-stone-900">Publift</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-stone-900">Create account</h2>
            <p className="text-stone-500 mt-2 text-sm">Start free — no credit card needed</p>
          </div>

          {/* Google Button */}
          <button
            onClick={() => window.location.href = `${API_URL}/auth/google`}
            className="w-full flex items-center justify-center gap-3 rounded-xl py-3.5 font-semibold text-sm text-stone-700 transition-all duration-200 hover:bg-stone-50 border border-stone-200 hover:border-stone-300"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs font-medium text-stone-400">or sign up with email</span>
            <div className="flex-1 h-px bg-stone-200" />
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
              {formData.password && passwordStrength?.strength > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full overflow-hidden bg-stone-200">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${passwordStrength.strength}%`, background: strengthColor }}
                    />
                  </div>
                  <p className="text-xs text-stone-400 mt-1.5 flex items-center gap-1">
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
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2 bg-green-600 hover:bg-green-700"
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

            <p className="text-xs text-stone-400 text-center">
              By creating an account you agree to our{' '}
              <span className="text-green-600 cursor-pointer hover:underline">Terms</span>
              {' & '}
              <span className="text-green-600 cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </form>

          <p className="text-center text-sm text-stone-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
              Sign in →
            </Link>
          </p>

          <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-stone-100">
            {['🔒 Secure', '⚡ Free plan', '🌍 6 Platforms'].map((item) => (
              <span key={item} className="text-xs text-stone-400 font-medium">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
