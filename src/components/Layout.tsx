import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/verses', label: 'Verses' },
    ...(isAdmin ? [{ path: '/verses/new', label: 'Add Verse' }] : []),
    { path: '/categories', label: 'Categories' },
    { path: '/tags', label: 'Tags' },
    { path: '/books', label: 'Books' },
    { path: '/progressions', label: 'Progressions' },
    { path: '/quiz', label: 'Quiz' },
    { path: '/settings', label: 'Settings' },
    ...(isAdmin ? [{ path: '/users', label: 'Users' }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold shrink-0" onClick={closeMenu}>
              Bible Verse DB
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-slate-900 text-white'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-600">
                <span className="text-xs text-gray-400">
                  {user?.email}
                  {isAdmin && (
                    <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded text-xs">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-slate-700 transition-colors"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-700 px-4 pb-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-slate-900 text-white'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-700 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {user?.email}
                {isAdmin && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded text-xs">
                    Admin
                  </span>
                )}
              </span>
              <button
                onClick={() => { handleLogout(); closeMenu(); }}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
