import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AiOutlineMenuUnfold } from 'react-icons/ai';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AdminProfileDropDown from '../../Components/Admin/AdminProfileDropDown';
import { getAlerts } from '../../api/alerts.api';
import { getPagination } from '../../utils/api.utils';
import useSocket from '../../hooks/useSocket';

const Navbar = React.memo(({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const isMounted = useRef(true);

  const fetchCount = useCallback(async () => {
    try {
      const res = await getAlerts({ status: 'active', limit: 1 });
      if (isMounted.current) {
        setActiveAlertCount(getPagination(res).total);
      }
    } catch {
      // silent — don't disrupt navigation
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchCount]);

  useSocket({
    'alert:new':          fetchCount,
    'alert:resolved':     fetchCount,
    'alert:acknowledged': fetchCount,
  });

  const goAlerts = useCallback(() => navigate('/admin/alerts'), [navigate]);

  return (
    <div className="w-full h-16 bg-white/90 backdrop-blur-sm flex flex-row items-center rounded-xl shadow-card sticky top-4 z-40 px-4">
      <button
        onClick={toggleSidebar}
        className="text-ink hover:text-brand-600 hover:bg-brand-50 transition-colors p-2 rounded-lg"
        aria-label="Toggle sidebar"
      >
        <AiOutlineMenuUnfold size={22} />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={goAlerts}
          className="relative text-ink hover:text-brand-600 hover:bg-brand-50 transition-colors p-2 rounded-lg"
          aria-label={`${activeAlertCount} active alerts`}
        >
          <FiBell size={22} />
          {activeAlertCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex">
              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-danger-400 opacity-60" />
              <span className="relative min-w-[16px] h-4 bg-danger-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {activeAlertCount > 99 ? '99+' : activeAlertCount}
              </span>
            </span>
          )}
        </button>

        <AdminProfileDropDown />
      </div>
    </div>
  );
});

Navbar.displayName = 'Navbar';
export default Navbar;
