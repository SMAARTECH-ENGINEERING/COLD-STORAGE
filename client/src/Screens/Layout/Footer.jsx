import React from 'react';

const YEAR = new Date().getFullYear();

const Footer = React.memo(() => (
  <footer className="bg-white shadow-soft text-gray-400 px-5 py-5 mb-4 mt-4 rounded-xl">
    <div className="flex flex-wrap justify-between items-center gap-2 text-sm">
      <span>{YEAR} © <span className="text-brand-600 font-medium">ColdStorage Monitor</span></span>
      <span className="text-gray-400">IoT Cold Storage Management System — SEPL</span>
    </div>
  </footer>
));

Footer.displayName = 'Footer';
export default Footer;
