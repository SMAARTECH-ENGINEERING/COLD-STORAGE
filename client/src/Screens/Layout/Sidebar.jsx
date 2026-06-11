import React from 'react';
import './Sidebar.css';
import SidebarsContent from './SidebarsContent';
import { MdOutlineStorefront } from 'react-icons/md';
import { AiOutlineClose } from 'react-icons/ai';
import { useAuth } from '../../context/AuthContext';

const SIDEBAR_STYLE = { zIndex: 50 };

const Sidebar = React.memo(({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <div
      className={`scroll-container overflow-y-auto left-0 w-64 bg-white shadow fixed inset-y-0 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}
      style={SIDEBAR_STYLE}
    >
      {/* Brand header */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#2E3A8C] rounded-lg flex items-center justify-center">
              <MdOutlineStorefront size={22} color="white" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#2E3A8C] leading-tight">Smaafrost</div>
              <div className="text-[10px] text-gray-400 leading-tight">Monitor</div>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-[#2E3A8C] transition-colors"
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
            <div className="w-8 h-8 bg-[#2E3A8C] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-[#2E3A8C] truncate">{user.name}</div>
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
