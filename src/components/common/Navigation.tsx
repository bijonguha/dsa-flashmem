import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Upload,
  Settings as SettingsIcon,
  BarChart3,
  LogOut,
  PlusCircle,
  Edit3,
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
    try {
      await onSignOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [onSignOut]);

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
        path: '/manage-cards',
        label: 'Manage Cards',
        icon: Edit3,
        onClick: () => navigate('/manage-cards'),
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
            <BookOpen className="h-8 w-8 text-primary-600" />
            <h1 className="text-xl font-bold text-neutral-800">DSA FlashMem</h1>
          </div>

          <div className="flex items-center space-x-4">
            {navigationItems.map(({ path, label, icon: Icon, onClick }) => (
              <button
                key={path}
                onClick={onClick}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActivePath(path)
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-neutral-500 hover:text-neutral-700'
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
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors text-neutral-500 hover:text-danger-600 disabled:opacity-50"
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