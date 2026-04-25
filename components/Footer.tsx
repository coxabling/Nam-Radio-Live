
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-12 py-12 bg-slate-900/80 border-t border-slate-800">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col items-center gap-4 mb-8">
           <img src="/logo192.svg" alt="Nam Radio Live Logo" className="w-16 h-16 opacity-80" />
           <p className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
             Nam Radio Live
           </p>
           <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
             Reducing inequalities for emerging artists by providing a platform that values their talent and recognition.
           </p>
        </div>
        
        <div className="flex justify-center gap-8 mb-8 text-sm font-semibold uppercase tracking-widest text-slate-500">
            <a href="#/" className="hover:text-amber-400 transition-colors">Home</a>
            <a href="#/mystation" className="hover:text-amber-400 transition-colors">My Station</a>
            <a href="#/contact" className="hover:text-amber-400 transition-colors">Contact</a>
        </div>

        <div className="pt-8 border-t border-slate-800/50 text-slate-600 text-sm">
          <p>&copy; {new Date().getFullYear()} Nam Radio Live. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;