import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <FiAlertCircle size={48} className="text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold text-[#2E3A8C] mb-2">404 — Page Not Found</h2>
      <p className="text-[#49608c] text-sm mb-6">The page you're looking for doesn't exist.</p>
      <button
        onClick={() => navigate('/admin/dashboard')}
        className="flex items-center gap-2 bg-[#2E3A8C] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#1e2d6e] transition-colors"
      >
        <FiArrowLeft size={16} /> Back to Dashboard
      </button>
    </div>
  );
};

export default NotFound;
