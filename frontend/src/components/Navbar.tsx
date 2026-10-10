import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import {
  BrainCircuit,
  LayoutDashboard,
  FileText,
  PlayCircle,
  Sparkles,
  LogOut,
  Menu,
  X,
  Globe2,
} from 'lucide-react';


export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  const isActive = (path: string) => {
    return location.pathname === path
      ? 'text-indigo-400 bg-slate-800/80 border-indigo-500'
      : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border-transparent';
  };


  const navLinks = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Resumes',
      path: '/resumes',
      icon: FileText,
    },
    {
      name: 'New Interview',
      path: '/setup',
      icon: PlayCircle,
    },
    {
      name: 'Practice Drills',
      path: '/practice',
      icon: Sparkles,
    },
    {
      name: 'Live Context',
      path: '/live-context',
      icon: Globe2,
    },
  ];


  return (
    <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to={user ? '/dashboard' : '/'}
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>

            <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              AI Interview Simulator
            </span>
          </Link>


          {/* Desktop Nav */}
          {user ? (
            <div className="hidden md:flex items-center space-x-1">

              {navLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border-b-2 ${isActive(link.path)}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}

            </div>
          ) : null}


          {/* User profile / actions */}
          <div className="hidden md:flex items-center space-x-4">

            {user ? (
              <div className="flex items-center space-x-3">

                <div className="flex items-center space-x-2 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/60 text-sm">

                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-semibold text-xs border border-indigo-500/30">
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  <span className="text-slate-300 font-medium text-xs">
                    {user.name}
                  </span>

                </div>


                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>

              </div>
            ) : (
              <div className="flex items-center space-x-3">

                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md shadow-indigo-600/20"
                >
                  Get Started
                </Link>

              </div>
            )}

          </div>


          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-400 hover:text-white p-2 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

          </div>

        </div>
      </div>


      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">

          {user ? (
            <>

              <div className="pb-2 border-b border-slate-800 text-sm text-slate-400">
                Signed in as{' '}
                <span className="font-semibold text-white">
                  {user.name}
                </span>
              </div>


              {navLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                      location.pathname === link.path
                        ? 'text-indigo-400 bg-slate-800'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-indigo-400" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}


              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-red-400 hover:bg-slate-800"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>

            </>
          ) : (

            <div className="space-y-2 pt-2">

              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium text-slate-200 bg-slate-800"
              >
                Sign In
              </Link>

              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600"
              >
                Create Free Account
              </Link>

            </div>

          )}

        </div>
      )}

    </nav>
  );
};