
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Receipt, Wallet, BookOpen, RefreshCcw, 
  ShoppingCart, Truck, Users, UserSquare, Package, 
  CreditCard, FileBarChart, Settings, X, ChevronDown, ChevronRight, Landmark, Briefcase, 
  PanelLeftClose, PanelLeftOpen, FileOutput,
  LayoutGrid, Calculator, ArrowRightLeft, Box, Users2, ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }: SidebarProps) => {
  // Accordion State: Only one group open at a time
  const [activeGroup, setActiveGroup] = useState<string>('Transactions');

  const toggleGroup = (group: string) => {
    if (isCollapsed) return;
    setActiveGroup(prev => prev === group ? '' : group);
  };

  const navGroups = [
    {
      title: 'Main',
      icon: LayoutGrid,
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Transactions',
      icon: Calculator,
      items: [
        { path: '/receipts', label: 'Receipts', icon: Receipt },
        { path: '/payments', label: 'Payments', icon: Wallet },
        { path: '/journal', label: 'Journal', icon: BookOpen },
        { path: '/contra', label: 'Contra', icon: RefreshCcw },
        { path: '/banks', label: 'Banks', icon: Landmark },
        { path: '/expenses', label: 'Expenses', icon: CreditCard },
      ]
    },
    {
      title: 'Trading',
      icon: ArrowRightLeft,
      items: [
        { path: '/sales', label: 'Sales', icon: ShoppingCart },
        { path: '/purchases', label: 'Purchases', icon: Truck },
        { path: '/debit-credit-notes', label: 'Debit/Credit Notes', icon: FileOutput },
      ]
    },
    {
      title: 'People & Inventory',
      icon: Box,
      items: [
        { path: '/customers', label: 'Customers', icon: Users },
        { path: '/vendors', label: 'Vendors', icon: UserSquare },
        { path: '/inventory', label: 'Inventory', icon: Package },
      ]
    },
    {
      title: 'HR & Payroll',
      icon: Users2,
      items: [
        { path: '/payroll', label: 'Payroll System', icon: Briefcase },
      ]
    },
    {
      title: 'System',
      icon: ShieldCheck,
      items: [
        { path: '/reports', label: 'Reports', icon: FileBarChart },
        { path: '/settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={clsx(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
      />

      {/* Sidebar Container */}
      <aside 
        className={clsx(
          "fixed left-0 top-0 z-50 h-screen bg-surface border-r border-border shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Header / Logo */}
        <div className={clsx("flex items-center h-20 border-b border-border transition-all duration-300", isCollapsed ? "justify-center px-0" : "justify-between px-6")}>
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="h-9 w-9 min-w-[2.25rem] rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-glow">
              <span className="text-white font-extrabold text-xl">N</span>
            </div>
            <span className={clsx("text-xl font-bold text-text-main tracking-tight transition-opacity duration-300", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
              Nexus
            </span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-text-muted hover:text-text-main">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {navGroups.map((group) => (
            <div key={group.title} className="relative">
              
              {/* Group Header */}
              {isCollapsed ? (
                 <div className="flex justify-center my-4 group relative" title={group.title}>
                    <div className="p-2 text-text-muted/50 bg-surface-highlight/50 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                        <group.icon size={16} />
                    </div>
                    {/* Hover Tooltip for Group Icon in Collapsed Mode */}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-surface-highlight border border-border text-text-main text-xs font-semibold rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                        {group.title}
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-surface-highlight border-l border-b border-border rotate-45 transform"></div>
                    </div>
                 </div>
              ) : (
                <button 
                  onClick={() => toggleGroup(group.title)}
                  className={clsx(
                    "flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider mb-2 mt-4 transition-colors px-3 py-2 rounded-lg hover:bg-surface-highlight",
                    activeGroup === group.title ? "text-primary bg-surface-highlight/50" : "text-text-muted/70"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <group.icon size={14} />
                    <span>{group.title}</span>
                  </div>
                  {activeGroup === group.title ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              )}
              
              {/* Group Items */}
              <div className={clsx(
                "space-y-1 transition-all overflow-hidden duration-300 ease-in-out", 
                // In collapsed mode, always show items (as icons). In expanded, follow activeGroup.
                isCollapsed || activeGroup === group.title ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              )}>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => clsx(
                      "group relative flex items-center rounded-xl transition-all duration-200",
                      isCollapsed ? "justify-center p-2.5 my-1" : "gap-3 px-3 py-2.5 ml-2",
                      isActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
                    )}
                  >
                    <item.icon 
                      size={20} 
                      className={clsx(
                        "transition-colors shrink-0", 
                        ({ isActive }: any) => isActive ? "text-primary" : "text-text-muted group-hover:text-text-main"
                      )} 
                    />
                    
                    {/* Label (Normal) */}
                    {!isCollapsed && (
                      <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.label}
                      </span>
                    )}

                    {/* Tooltip (Collapsed) */}
                    {isCollapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-surface-highlight border border-border text-text-main text-xs font-semibold rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                        {item.label}
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-surface-highlight border-l border-b border-border rotate-45 transform"></div>
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Toggle */}
        <div className="p-3 border-t border-border hidden lg:flex justify-end">
          <button 
            onClick={toggleCollapse}
            className={clsx(
               "p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-surface-highlight transition-all",
               isCollapsed ? "mx-auto" : "ml-auto"
            )}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
             {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
