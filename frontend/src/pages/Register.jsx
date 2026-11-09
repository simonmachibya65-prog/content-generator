import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { showToast } from '../lib/toast';
import { validators, getPasswordStrength } from '../lib/validation';
import { FormInput } from '../components/FormInput';
import { Button } from '../components/Button';
import { Zap, Check, User, Mail } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PERKS = [
  'Free forever plan available',
  'No credit card required',
  'Connect all social accounts',
  'AI-powered content generation'
];

export default function Register() {
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const passwordStrength = getPasswordStrength(formData.password);

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
    if (name === 'full_name') {
      error = validators.required(value, 'Full name') || validators.minLength(value, 2, 'Full name');
    }
    if (name === 'email') {
      error = validators.email(value);
    }
    if (name === 'password') {
      error = validators.password(value, { minLength: 8 });
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const nameError = validators.required(formData.full_name, 'Full name') || validators.minLength(formData.full_name, 2, 'Full name');
    const emailError = validators.email(formData.email);
    const passwordError = validators.password(formData.password, { minLength: 8 });
    
    if (nameError || emailError || passwordError) {
      setErrors({ 
        full_name: nameError, 
        email: emailError, 
        password: passwordError 
      });
      setTouched({ full_name: true, email: true, password: true });
      return;
    }

    setLoading(true);
    try {
      await register(formData.full_name, formData.email, formData.password);
      showToast.success('Account created! Let\'s get started 🚀');
      navigate('/quick-start');
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ─── */}
      <div className="hidden lg:flex lg:w-[45%] auth-bg flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute top-[-100px] right-[-80px] w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-purple-600/10 blur-3xl" />

        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-emerald-500 rounded-xl flex items-center justify-center shadow-glow-teal">
            <Zap size={22} className="text-dark-base" />
          </div>
          <span className="text-2xl font-bold text-white">Cotents</span>
        </div>

        <h2 className="text-4xl font-black text-white leading-snug mb-4">
          Everything you need<br />
          <span className="gradient-text">to grow on social</span>
        </h2>
        <p className="text-slate-400 text-base mb-10 leading-relaxed">
          Join thousands of creators and businesses who automate their social media with AI.
        </p>

        <div className="space-y-4">
          {PERKS.map(perk => (
            <div key={perk} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Check size={13} className="text-indigo-400" />
              </div>
              <span className="text-slate-300 text-sm">{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ─── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-dark-base">
        <div className="w-full max-w-[420px] animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 bg-gradient-to-br from-accent-primary to-emerald-500 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-dark-base" />
            </div>
            <span className="text-xl font-bold text-white">Cotents</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Create account</h2>
            <p className="text-gray-400 mt-2">Start free — no credit card needed</p>
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

          <div className="divider mb-5">or sign up with email</div>

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
                helpText="Use 8+ characters with uppercase, lowercase, and numbers"
              />
              
              {/* Password strength indicator */}
              {formData.password && passwordStrength.strength > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.color === 'red' ? 'bg-red-500' :
                        passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                        passwordStrength.color === 'blue' ? 'bg-blue-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {passwordStrength.label} password
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              Create free account
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By creating an account you agree to our{' '}
              <span className="text-accent-primary cursor-pointer hover:underline">Terms of Service</span>
              {' '}and{' '}
              <span className="text-accent-primary cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
