import React, { useState } from 'react';

// Icons
const MailIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const PhoneIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>);
const LocationIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const TwitterIcon = () => (<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>);
const FacebookIcon = () => (<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>);
const InstagramIcon = () => (<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163m0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.28.072-1.689.072-4.947s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98C15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/></svg>);
const CheckCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>);


const Contact: React.FC = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSubmissionStatus('idle');

        // Simulate API call
        await new Promise(res => setTimeout(res, 1500));

        // In a real app, you'd send the data to a server here.
        // For this demo, we'll just simulate a success.
        console.log('Form data submitted:', formData);

        setIsLoading(false);
        setSubmissionStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });

        // Hide success message after a few seconds
        setTimeout(() => setSubmissionStatus('idle'), 5000);
    };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = '#/';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center sm:text-left">
        <a href="#/" onClick={handleHomeClick} className="text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Home
        </a>
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-white text-center sm:text-left mb-2">Contact Us</h1>
      <p className="text-slate-400 text-center sm:text-left mb-8">We'd love to hear from you! Send us a message using the form below.</p>
      
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Left side: Info */}
          <div className="space-y-8 flex flex-col justify-between">
              <div>
                  <h2 className="text-2xl font-bold tracking-wide text-amber-300">Get In Touch</h2>
                  <p className="text-slate-400 mt-2">Here's how you can reach us directly. For general messages, please use the contact form.</p>
              </div>
              <div className="space-y-6">
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"><div className="p-2 bg-slate-800 rounded-full text-amber-400 flex-shrink-0"><MailIcon /></div><div><h3 className="font-semibold text-white">General Inquiries</h3><a href="mailto:info@namradiolive.com" className="text-slate-300 hover:text-amber-300 transition-colors break-all">info@namradiolive.com</a></div></div>
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"><div className="p-2 bg-slate-800 rounded-full text-amber-400 flex-shrink-0"><PhoneIcon /></div><div><h3 className="font-semibold text-white">Studio Line</h3><a href="tel:+441234567890" className="text-slate-300 hover:text-amber-300 transition-colors">+44 1234 567890</a></div></div>
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"><div className="p-2 bg-slate-800 rounded-full text-amber-400 flex-shrink-0"><LocationIcon /></div><div><h3 className="font-semibold text-white">Our Location</h3><p className="text-slate-300">Windhoek, Namibia</p></div></div>
              </div>
              <div>
                  <h3 className="font-semibold text-white mb-3">Follow Us</h3>
                  <div className="flex items-center gap-4 text-slate-400">
                      <a href="https://x.com/nam_radio" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Twitter" className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-all text-white hover:scale-110"><TwitterIcon /></a>
                      <a href="https://www.facebook.com/namradioglobal" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Facebook" className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-all text-white hover:scale-110"><FacebookIcon /></a>
                      <a href="https://www.instagram.com/nam_radio" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram" className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-all text-white hover:scale-110"><InstagramIcon /></a>
                  </div>
              </div>
          </div>
          {/* Right side: Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Full Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow focus:shadow-lg focus:shadow-amber-500/20" disabled={isLoading} /></div>
                <div><label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email Address</label><input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow focus:shadow-lg focus:shadow-amber-500/20" disabled={isLoading} /></div>
                <div><label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-1">Subject</label><input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow focus:shadow-lg focus:shadow-amber-500/20" disabled={isLoading} /></div>
                <div><label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1">Message</label><textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={5} required className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-shadow focus:shadow-lg focus:shadow-amber-500/20" disabled={isLoading}></textarea></div>
                <button type="submit" disabled={isLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-amber-700/50 disabled:cursor-wait">{isLoading ? 'Sending...' : 'Send Message'}</button>
            </form>
            {submissionStatus === 'success' && (
                <div className="mt-4 flex items-center gap-3 p-3 text-sm bg-green-500/10 text-green-300 rounded-lg animate-fade-in border border-green-500/20">
                    <CheckCircleIcon />
                    <strong>Message sent successfully! We'll be in touch soon.</strong>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default Contact;
