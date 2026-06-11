import React from 'react';

const YEAR = new Date().getFullYear();

const Footer = React.memo(() => (
  <footer className="bg-white shadow-sm text-[#7f8296] px-5 py-3 mb-4 rounded-xl mt-4">
    <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
      <span>{YEAR} © <span className="text-[#2E3A8C] font-medium">ColdStorage Monitor</span></span>
      <span className="text-gray-400">IoT Cold Storage Management System — SEPL</span>
    </div>
  </footer>
));

Footer.displayName = 'Footer';
export default Footer;
