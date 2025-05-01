import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';
import useAuth from '../contexts/useAuth';

interface LocationState {
  from?: {
    pathname: string;
  };
  message?: string;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const state = location.state as LocationState;
  const from = state?.from?.pathname || '/dashboard';

  // Check for message in location state (e.g., from registration)
  useEffect(() => {
    if (state?.message) {
      setMessage(state.message);
    }

    // Clear any existing tokens on login page load
    const clearExistingAuth = async () => {
      // Remove token from localStorage
      localStorage.removeItem('access_token');

      // For development purposes, attempt to sign out to clear session
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error clearing auth state:', err);
      }
    };

    clearExistingAuth();
  }, [state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // Sign in using context method
      const { error } = await signIn(email, password);

      if (error) throw error;

      // Get the session token after successful authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (token) {
        localStorage.setItem('access_token', token);
        // Navigate to the intended page or dashboard after successful login
        navigate(from, { replace: true });
      } else {
        throw new Error('No session token found');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
        console.error('Error during login:', error.message);
      } else {
        setError('An unexpected error occurred');
        console.error('Error during login: An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 p-4 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 p-4 rounded-md text-green-700 text-sm">
                {message}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500"></span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
