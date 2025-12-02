import React, { useEffect, useState } from 'react';
import { Search, Bell, Sun, Moon, Menu, LogOut, MessageSquare, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { user, logout } = useAuth();
  
  // Initialize state based on localStorage or default to dark
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || !savedTheme; 
  });

  // Effect to apply theme class and save preference
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between bg-surface/80 backdrop-blur-xl px-6 border-b border-border transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2 text-text-muted hover:text-text-main lg:hidden rounded-lg hover:bg-surface-highlight transition-colors"
        >
          <Menu size={22} />
        </button>
        
        {/* Icons visible on Desktop */}
        <div className="hidden md:flex items-center gap-1 text-text-muted">
             <button className="p-2 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"><MessageSquare size={18} /></button>
             <button className="p-2 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"><Calendar size={18} /></button>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:block relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="h-10 w-72 rounded-full bg-surface-highlight border border-transparent focus:border-primary/30 pl-10 pr-4 text-sm text-text-main focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-muted/60"
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme} 
            className="p-2.5 text-text-muted hover:text-warning hover:bg-warning/10 rounded-full transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button className="relative p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
            <Bell size={20} />
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] text-white font-bold ring-2 ring-surface">5</span>
          </button>
          
          <div className="h-8 w-px bg-border mx-2"></div>

          <div className="group relative flex items-center gap-3 cursor-pointer p-1 rounded-xl hover:bg-surface-highlight transition-colors">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-text-main leading-tight">{user?.name}</p>
              <p className="text-[11px] text-text-muted uppercase font-bold tracking-wider">{user?.role}</p>
            </div>
            <div className="relative">
               <img 
                 src={user?.avatar} 
                 alt="User" 
                 className="h-10 w-10 rounded-full border border-border object-cover shadow-sm group-hover:border-primary transition-colors"
               />
               <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border-2 border-surface"></div>
            </div>
            
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 origin-top-right scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible transition-all duration-200 rounded-2xl bg-surface border border-border shadow-xl z-50 p-2">
                <button 
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;