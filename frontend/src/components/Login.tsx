import React, { useState } from 'react';
import { apiService } from '../services/api';
import { Button } from './Button';
import { Card } from './Card';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('test123');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await apiService.login(email, password);
      } else {
        await apiService.register(email, password, name);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <Card className="w-full max-w-md">
        <h1 className="text-h1 font-semibold text-center mb-6">
          Seizure Monitor
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-bodySmall text-ink-60 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-ink-60/20 rounded-lg"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-bodySmall text-ink-60 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-ink-60/20 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-bodySmall text-ink-60 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-ink-60/20 rounded-lg"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-bodySmall">{error}</p>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
          </Button>
        </form>

        <p className="text-center text-bodySmall text-ink-60 mt-4">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-primary font-semibold"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>

        <p className="text-center text-xs text-ink-60 mt-4">
          Default: test@example.com / test123
        </p>
      </Card>
    </div>
  );
};