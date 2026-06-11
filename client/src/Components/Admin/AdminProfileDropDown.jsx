import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Divider from '@mui/material/Divider';
import { FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const MENU_PAPER = {
  sx: { width: 200, mt: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', borderRadius: '10px' },
};
const TRANSFORM_ORIGIN = { horizontal: 'right', vertical: 'top' };
const ANCHOR_ORIGIN    = { horizontal: 'right', vertical: 'bottom' };
const ITEM_SX          = { fontSize: 14, gap: 1 };
const ITEM_LOGOUT_SX   = { fontSize: 14, gap: 1, color: '#ef4444' };

const AdminProfileDropDown = React.memo(() => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleOpen    = useCallback((e) => setAnchorEl(e.currentTarget), []);
  const handleClose   = useCallback(() => setAnchorEl(null), []);
  const handleProfile = useCallback(() => { setAnchorEl(null); navigate('/admin/profile'); }, [navigate]);
  const handleSettings = useCallback(() => { setAnchorEl(null); navigate('/admin/settings'); }, [navigate]);

  const handleLogout = useCallback(async () => {
    setAnchorEl(null);
    try {
      await logout();
      navigate('/');
    } catch {
      toast.error('Logout failed');
    }
  }, [logout, navigate]);

  return (
    <div>
      <button
        onClick={handleOpen}
        className="w-9 h-9 bg-[#2E3A8C] rounded-full flex items-center justify-center text-white text-sm font-bold hover:bg-[#1e2d6e] transition-colors"
        aria-label="Open profile menu"
      >
        {user?.name?.charAt(0).toUpperCase() || 'U'}
      </button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={MENU_PAPER}
        transformOrigin={TRANSFORM_ORIGIN}
        anchorOrigin={ANCHOR_ORIGIN}
      >
        <div className="px-4 py-2">
          <div className="text-sm font-semibold text-[#2E3A8C] truncate">{user?.name}</div>
          <div className="text-xs text-gray-400 truncate capitalize">
            {user?.role?.displayName || user?.role?.name}
          </div>
        </div>
        <Divider />
        <MenuItem onClick={handleProfile} sx={ITEM_SX}>
          <FiUser size={16} /> Profile
        </MenuItem>
        <MenuItem onClick={handleSettings} sx={ITEM_SX}>
          <FiSettings size={16} /> Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={ITEM_LOGOUT_SX}>
          <FiLogOut size={16} /> Logout
        </MenuItem>
      </Menu>
    </div>
  );
});

AdminProfileDropDown.displayName = 'AdminProfileDropDown';
export default AdminProfileDropDown;
