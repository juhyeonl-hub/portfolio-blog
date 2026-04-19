import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    api.get('/admin/analytics').then(setAnalytics).catch(console.error);
    api.get('/admin/analytics/today-sessions').then(setSessions).catch(console.error);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <button onClick={handleLogout}
          className="px-3 py-1 text-sm border border-gray-700 hover:border-red-500 text-gray-400 hover:text-red-400 rounded transition-colors">
          Logout
        </button>
      </div>
      <p className="text-gray-400 mb-8">Logged in as: {user?.username}</p>

      {analytics && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-3xl font-bold text-white">{analytics.totalViews}</p>
            <p className="text-sm text-gray-400">Total page views</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-3xl font-bold text-white">{analytics.todayViews}</p>
            <p className="text-sm text-gray-400">Today</p>
          </div>
        </div>
      )}

      {analytics && analytics.topPages && analytics.topPages.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Pages</h3>
          <div className="space-y-2">
            {analytics.topPages.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-300">{p.path}</span>
                <span className="text-gray-500">{p.views} views</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Today's Sessions ({sessions.length})</h3>
          <div className="space-y-3">
            {sessions.map((s, i) => (
              <div key={i} className="border border-gray-800 rounded p-3 text-sm">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{s.firstSeen} → {s.lastSeen}</span>
                  <span>{s.pageCount} page{s.pageCount > 1 ? 's' : ''}</span>
                </div>
                {s.referer && (
                  <div className="text-gray-300 text-xs mb-1 break-all">
                    <span className="text-gray-500">From:</span> {s.referer}
                  </div>
                )}
                {s.userAgent && (
                  <div className="text-gray-400 text-xs mb-2 truncate" title={s.userAgent}>
                    <span className="text-gray-500">UA:</span> {s.userAgent}
                  </div>
                )}
                <div className="text-gray-300 text-xs">
                  <span className="text-gray-500">Path:</span>{' '}
                  {s.paths.join(' → ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard title="Projects" description="Manage portfolio projects" to="/admin/projects" />
        <DashboardCard title="Journal" description="Write and manage blog posts" to="/admin/posts" />
        <DashboardCard title="Resume" description="Edit resume sections" to="/admin/resume" />
        <DashboardCard title="Settings" description="Change password, TOTP setup" to="/admin/settings" />
      </div>
    </div>
  );
}

function DashboardCard({ title, description, to }) {
  return (
    <Link to={to}
      className="block p-6 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors">
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </Link>
  );
}
