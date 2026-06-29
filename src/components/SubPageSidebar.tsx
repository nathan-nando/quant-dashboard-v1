import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  badge?: number;
}

interface SubPageSidebarProps {
  navItems: NavItem[];
  currentTab: string;
  onTabChange: (tabId: string) => void;
}

export default function SubPageSidebar({ navItems, currentTab, onTabChange }: SubPageSidebarProps) {
  return (
    <div className="page-sidebar">
      {navItems.map(item => {
        const isActive = currentTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={isActive ? "settings-sidebar-item active" : "settings-sidebar-item"}
          >
            {Icon && <Icon size={16} style={{ marginRight: '0.5rem' }} />}
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span style={{ marginLeft: 'auto', backgroundColor: '#24a148', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '8px' }}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
