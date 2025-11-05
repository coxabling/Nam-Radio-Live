import React from 'react';

const About: React.FC = () => {
  return (
    <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50">
      <h2 className="text-2xl font-bold mb-4 tracking-wide text-amber-300">About Nam Radio Live</h2>
      <div className="space-y-4 text-slate-300">
        <p>
          Broadcasting live from the vibrant heart of Windhoek, Namibia, Nam Radio Live is more than just a station—it's a community. Our mission is to connect diverse cultures and voices through the universal language of music, news, and shared knowledge. We believe in the power of radio to unite, inform, and inspire.
        </p>
        <p>
          Founded with a passion for community broadcasting, Nam Radio Live has grown into a vital hub for listeners both locally and globally. We are dedicated to providing a platform that reflects the rich cultural tapestry of our audience, offering a unique blend of music genres, insightful talk shows, and up-to-the-minute news that matters to you. Join us and be part of the Nam Radio Live family.
        </p>
      </div>
    </section>
  );
};

export default About;