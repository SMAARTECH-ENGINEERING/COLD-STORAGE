import React from 'react';

// Kept for backward compatibility — new Login.jsx does not use this component.
const LeftSection = ({ logo }) => (
  <div className="hidden md:flex flex-col justify-center items-center bg-[#2E3A8C] text-white px-12">
    {logo && <img src={logo} alt="Logo" className="mb-6 h-16 object-contain" />}
    <h1 className="text-3xl font-bold text-center">Cold Storage Monitor</h1>
  </div>
);

export default LeftSection;
