import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User } from 'lucide-react';
import { Navbar } from './Navbar';
import { useToast } from './Toast';
import { API_BASE } from '../config';

export function AdminLogin() {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { success, error } = useToast();

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
      const endpoint = isSignup ? '/admin/signup' : '/admin/login';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.accessToken);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        success(isSignup ? 'Admin account created successfully!' : 'Login successful!');
        navigate('/admin/dashboard');
      } else {
        error(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      error('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center">
        <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Login</h1>
        <p className="text-gray-600 text-sm sm:text-base mb-6">Admin access for first responders</p>

        <div className="bg-white rounded-xl border border-gray-300 p-6 sm:p-8">
          <div className="flex items-center justify-center gap-2 mb-6 text-gray-600">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="text-lg font-semibold text-gray-800">First Responder Access</span>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all active:scale-95 ${
                !isSignup
                  ? 'border-2 border-slate-100 bg-slate-700 text-white'
                  : 'border-2 border-gray-100 bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all active:scale-95 ${
                isSignup
                  ? 'border-2 border-slate-100 bg-slate-700 text-white'
                  : 'border-2 border-gray-100 bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
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
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={isSignup ? "email" : "text"}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder={isSignup ? "admin@example.com" : "admin or email"}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
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
              className="w-full border-2 border-slate-100 bg-slate-700 text-white py-3 rounded-xl hover:bg-slate-800 active:scale-95 transition-all font-medium disabled:opacity-50"
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
    </div>
  );
}

export default AdminLogin;
