import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function GoogleAuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setAccessToken } = useAuthStore();

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refresh');

      if (!token) {
        toast.error('Authentication failed');
        navigate('/login');
        return;
      }

      try {
        // Set the token
        useAuthStore.setState({
          accessToken: token,
          isAuthenticated: true
        });

        // Fetch user profile
        const { data } = await api.get('/auth/me');
        useAuthStore.setState({ user: data.user });

        toast.success('Welcome! Setting up your account...');
        
        // Check if user needs to complete quick start
        const { data: accountsData } = await api.get('/social-accounts');
        
        if (accountsData.accounts.length === 0) {
          // New user - go to quick start
          navigate('/quick-start');
        } else {
          // Existing user - go to dashboard
          navigate('/');
        }
      } catch (err) {
        toast.error('Failed to complete authentication');
        navigate('/login');
      }
    };

    handleAuth();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
