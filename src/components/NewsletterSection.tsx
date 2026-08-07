import React, { useState } from 'react';
import { Mail, ArrowRight, Check, Loader2 } from 'lucide-react';

interface NewsletterSectionProps {
  onSubscribeSuccess: (message: string, type: 'success' | 'info' | 'error') => void;
  eyebrow?: string;
  title?: string;
  description?: string;
  buttonText?: string;
}

export default function NewsletterSection({ onSubscribeSuccess, eyebrow = 'Exclusive Insights & Priority Access', title = 'Subscribe to TECH SELLER News', description = 'Get the latest tech news, high-end hardware drops, and exclusive tech deals delivered to your inbox.', buttonText = 'Subscribe' }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'subscribed'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      onSubscribeSuccess('Please enter a valid email address.', 'error');
      return;
    }

    setStatus('submitting');

    // Process subscription request
    setTimeout(() => {
      setStatus('subscribed');
      onSubscribeSuccess(`Thank you! "${email}" has been subscribed to our elite mailing list.`, 'success');
      setEmail('');
      // Reset back to idle after 5 seconds to let them subscribe again if needed
      setTimeout(() => {
        setStatus('idle');
      }, 5000);
    }, 1500);
  };

  return (
    <div className="border-t border-neutral-400 bg-neutral-50 py-12 md:py-16" id="newsletter-footer-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Text/Header info */}
          <div className="lg:col-span-6 text-left space-y-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 font-bold block">
              {eyebrow}
            </span>
            <h3 className="font-sans text-xl font-extrabold uppercase tracking-widest text-neutral-900 sm:text-2xl">
              {title}
            </h3>
            <p className="font-sans text-xs text-neutral-500 uppercase tracking-wider max-w-md">
              {description}
            </p>
          </div>

          {/* Form */}
          <div className="lg:col-span-6 w-full">
            <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row gap-2" id="newsletter-form">
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 pointer-events-none">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'submitting'}
                  placeholder="ENTER YOUR EMAIL ADDRESS..."
                  className="w-full bg-white border border-neutral-400 py-3.5 pl-10 pr-4 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-900 placeholder-neutral-400 focus:border-neutral-950 focus:ring-0 outline-none transition-colors"
                  required
                  id="newsletter-email-input"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="inline-flex items-center justify-center bg-neutral-950 px-6 py-3.5 font-mono text-[10px] font-extrabold uppercase tracking-widest text-white hover:bg-neutral-800 active:bg-neutral-950 disabled:opacity-80 transition-colors shrink-0"
                id="newsletter-submit-btn"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : status === 'subscribed' ? (
                  <>
                    <Check className="mr-2 h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Subscribed</span>
                  </>
                ) : (
                  <>
                    <span>{buttonText}</span>
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Success response indicator below form */}
            {status === 'subscribed' && (
              <p className="mt-2 text-left font-mono text-[9px] font-bold text-emerald-600 uppercase tracking-wider animate-fade-in" id="newsletter-success-msg">
                ✓ Check your inbox for a 15% welcome code invitation.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
