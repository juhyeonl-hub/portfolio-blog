import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpRequired, setTotpRequired] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login(username, password, totpRequired ? totpCode : null);
      if (result.totpRequired) {
        setTotpRequired(true);
      } else if (result.token) {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-8 text-center">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          {totpRequired && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">OTP Code</label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                maxLength={6}
              />
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            {totpRequired ? 'Verify OTP' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
