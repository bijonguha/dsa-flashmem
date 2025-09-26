import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Upload,
  Settings as SettingsIcon,
  BarChart3,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavigationProps {
  onSignOut: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const handleSignOut = useCallback(async () => {
    await onSignOut();
    navigate('/');
  }, [onSignOut, navigate]);

  const navigationItems = useMemo(
    () => [
      {
        path: '/home',
        label: 'Home',
        icon: null,
        onClick: () => navigate('/home'),
      },
      {
        path: '/create-flashcard',
        label: 'Create',
        icon: PlusCircle,
        onClick: () => navigate('/create-flashcard'),
      },
      {
        path: '/import',
        label: 'Import',
        icon: Upload,
        onClick: () => navigate('/import'),
      },
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: BarChart3,
        onClick: () => navigate('/dashboard'),
      },
      {
        path: '/settings',
        label: 'Settings',
        icon: SettingsIcon,
        onClick: () => navigate('/settings'),
      },
    ],
    [navigate],
  );

  const isActivePath = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">DSA FlashMem</h1>
          </div>

          <div className="flex items-center space-x-4">
            {navigationItems.map(({ path, label, icon: Icon, onClick }) => (
              <button
                key={path}
                onClick={onClick}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActivePath(path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{label}</span>
              </button>
            ))}

            {user && (
              <button
                onClick={handleSignOut}
                disabled={authLoading}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-500 hover:text-red-700 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};