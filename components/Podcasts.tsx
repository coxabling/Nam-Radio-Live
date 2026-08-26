
import React from 'react';

const Podcasts: React.FC = () => {
  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-700/50">
      <h2 className="text-2xl font-bold mb-4 tracking-wide text-amber-300">Podcasts</h2>
      <iframe
        title="Podcasts"
        src="https://music-station.live/public/namradio/podcasts?embed=true"
        style={{ width: '100%', minHeight: '400px', height: '400px', border: 0, borderRadius: '12px' }}
      ></iframe>
    </section>
  );
};

export default Podcasts;