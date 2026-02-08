import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User } from 'lucide-react';
import { BackToHomeButton } from './BackToHomeButton';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function AdminLogin() {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Login attempt:', formData.email, formData.password);
      
      if (!isSignup && formData.email.trim() === 'admin' && formData.password.trim() === 'adminadmin') {
        console.log('Using hardcoded admin credentials');
        
        const fakeToken = 'hardcoded-admin-token';
        const fakeUser = {
          email: 'admin@aegis.local',
          user_metadata: {
            name: 'System Admin',
            role: 'admin'
          }
        };
        
        localStorage.setItem('adminToken', fakeToken);
        localStorage.setItem('adminUser', JSON.stringify(fakeUser));
        
        console.log('Admin login successful, navigating to dashboard');
        alert('Login successful!');
        setIsLoading(false);
        navigate('/admin/dashboard');
        return;
      }

      console.log('Attempting Supabase authentication');
      
      const endpoint = isSignup ? '/admin/signup' : '/admin/login';
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-636dcea6${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.accessToken);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        
        alert(isSignup ? 'Admin account created successfully!' : 'Login successful!');
        navigate('/admin/dashboard');
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-md mx-auto px-4 py-8">
        <BackToHomeButton className="mb-6" />

        <div className="bg-white rounded-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Aegis Admin</h1>

          <div className="flex items-center justify-center gap-2 mb-6 text-gray-600">
            <Shield className="w-5 h-5" />
            <p className="text-sm">First Responder Access</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                !isSignup 
                  ? 'bg-slate-700 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isSignup 
                  ? 'bg-slate-700 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -tranneutral-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Smith"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email {!isSignup && <span className="text-xs text-gray-500">(or username)</span>}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -tranneutral-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={isSignup ? "email" : "text"}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isSignup ? "admin@example.com" : "admin or email"}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -tranneutral-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              {isSignup && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-800 active:scale-95 transition-all font-medium disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (isSignup ? 'Create Admin Account' : 'Login')}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-300">
            <p className="text-xs text-gray-500 text-center">
              Admin access is for authorized first responders only
            </p>
            <p className="text-xs text-gray-400 text-center mt-2">
              Quick login: admin / adminadmin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
