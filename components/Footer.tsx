
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-12 py-8 bg-slate-900/50">
      <div className="container mx-auto text-center text-slate-500">
        <p className="mb-2">
          <a href="#/contact" className="hover:text-slate-200 transition-colors">Contact Us</a>
        </p>
        <p>&copy; {new Date().getFullYear()} Nam Radio Live. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;