
import React, { useState } from 'react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (username: string, password_plain: string) => Promise<boolean>;
  onSignUp: (username: string, password_plain: string) => Promise<boolean>;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin, onSignUp }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!username || !password) {
          setError('Please enter a username and password.');
          return;
        }
        const success = await onLogin(username, password);
        if (!success) {
          setError('Invalid username or password.');
        }
      } else if (mode === 'signup') {
        if (!username || !password) {
          setError('Please enter a username and password.');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        const success = await onSignUp(username, password);
        if (!success) {
          setError('A user with this name already exists.');
        }
      }
    } catch (e) {
        setError('An unexpected error occurred. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };
  
  const renderContent = () => {
      if (mode === 'forgot') {
          return (
              <>
                  <h2 className="text-2xl font-bold mb-6 tracking-wide text-amber-300 text-center">
                      Reset Password
                  </h2>
                  <div className="text-center text-slate-300 bg-slate-800/50 p-4 rounded-lg">
                      <p>For password assistance, please contact our support team via email.</p>
                      <a href="mailto:support@namradiolive.com" className="font-bold text-amber-400 hover:text-amber-300 break-all">support@namradiolive.com</a>
                  </div>
                  <button onClick={() => setMode('login')} disabled={isLoading} className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed">
                      Back to Login
                  </button>
              </>
          );
      }

      return (
          <>
            <h2 className="text-2xl font-bold mb-6 tracking-wide text-amber-300 text-center">
                {mode === 'signup' ? 'Create an Account' : 'Login to Nam Radio Live'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50" required autoFocus disabled={isLoading} autoComplete="username" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="password"className="block text-sm font-medium text-slate-300">Password</label>
                    {mode === 'login' && (
                        <button type="button" onClick={() => setMode('forgot')} className="text-xs text-amber-400 hover:text-amber-300 font-semibold disabled:opacity-50" disabled={isLoading}>Forgot Password?</button>
                    )}
                </div>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50" required disabled={isLoading} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              </div>
              {mode === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword"className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                  <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50" required disabled={isLoading} autoComplete="new-password"/>
                </div>
              )}
              
              {error && <p className="text-center text-red-400 bg-red-500/10 p-2 rounded-lg text-sm">{error}</p>}
              
              <button type="submit" disabled={isLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-amber-700/50 disabled:cursor-wait">
                {isLoading ? 'Processing...' : (mode === 'signup' ? 'Sign Up' : 'Login')}
              </button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-6">
              {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
              <button onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')} className="font-semibold text-amber-400 hover:text-amber-300 ml-2 disabled:opacity-50" disabled={isLoading}>
                {mode === 'signup' ? 'Login here' : 'Sign up now'}
              </button>
            </p>
          </>
      );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-slate-700/50 w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close form"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default LoginModal;