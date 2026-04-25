import React from 'react';

const About: React.FC = () => {
  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50 overflow-hidden relative">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        <div className="flex-shrink-0">
          <div className="relative">
            <img src="/logo192.svg" alt="Nam Radio Live Logo" className="w-24 h-24 md:w-32 md:h-32 shadow-2xl rounded-2xl" />
            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full -z-10 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex-grow text-center md:text-left">
          <h2 className="text-3xl font-extrabold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500 inline-block">
            About Nam Radio Live
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed max-w-2xl">
            <p>
              Broadcasting live from the vibrant heart of <span className="text-amber-400 font-semibold tracking-wide">Windhoek, Namibia</span>, Nam Radio Live is more than just a station—it's a digital home for cultural expression.
            </p>
            <p>
              Our mission is to reduce inequalities for emerging artists by providing a professional, judgment-free platform where talent is recognized and amplified. We believe in the power of radio to unite, inform, and inspire.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;