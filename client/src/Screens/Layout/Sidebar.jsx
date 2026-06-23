import React from 'react';
import './Sidebar.css';
import SidebarsContent from './SidebarsContent';
import { AiOutlineClose } from 'react-icons/ai';
import { useAuth } from '../../context/AuthContext';
import logo from '../../Assets/Logos/logo.png';

const SIDEBAR_STYLE = { zIndex: 50 };

const Sidebar = React.memo(({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <div
      className={`scroll-container overflow-y-auto left-0 w-64 bg-white shadow-card fixed inset-y-0 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}
      style={SIDEBAR_STYLE}
    >
      {/* Brand header */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Smaafrost" className="h-9 w-auto object-contain" />
            <div>
              <div className="text-sm font-bold text-brand-600 leading-tight">Smaafrost</div>
              <div className="text-[10px] text-gray-400 leading-tight">Monitor</div>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg p-1 transition-colors"
            aria-label="Close sidebar"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-3 overflow-y-auto">
        <SidebarsContent />
      </div>

      {/* User footer */}
      {user && (
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-brand-600 truncate">{user.name}</div>
              <div className="text-[10px] text-gray-400 truncate capitalize">
                {user.role?.displayName || user.role?.name}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;
