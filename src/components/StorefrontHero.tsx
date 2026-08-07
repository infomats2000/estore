import React from 'react';
import { StoreSettings } from '../types';

export default function StorefrontHero({ settings }: { settings: StoreSettings }) {
  return (
    <section className="relative overflow-hidden bg-slate-50 dark:bg-neutral-950 border-b border-slate-200 dark:border-neutral-800" id="storefront-hero">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20 grid md:grid-cols-2 items-center gap-12">
        <div className="space-y-5 text-left relative z-10">
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{settings.heroEyebrow}</span>
          <h1 className="font-sans text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-950 dark:text-white leading-tight">
            {settings.heroTitle}<br /><span className="text-blue-600">{settings.heroHighlight}</span>
          </h1>
          <p className="max-w-xl text-sm font-medium leading-relaxed text-neutral-600 dark:text-neutral-300">{settings.heroDescription}</p>
          <div className="flex flex-wrap gap-3">
            {settings.heroPrimaryButtonText && <a href={settings.heroPrimaryButtonUrl || '#product-catalog-grid'} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-mono text-[10px] font-black uppercase tracking-wider">{settings.heroPrimaryButtonText}</a>}
            {settings.heroSecondaryButtonText && <a href={settings.heroSecondaryButtonUrl || '#store-footer'} className="border border-neutral-400 hover:border-neutral-900 px-5 py-3 font-mono text-[10px] font-black uppercase tracking-wider text-neutral-800 dark:text-white">{settings.heroSecondaryButtonText}</a>}
          </div>
        </div>
        <div className="relative min-h-64 flex items-center justify-center">
          <div className="absolute -top-6 -right-6 h-32 w-32 bg-blue-400 rounded-full blur-3xl opacity-20" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 bg-blue-600 rounded-full blur-3xl opacity-20" />
          {settings.heroImageUrl && <img src={settings.heroImageUrl} alt={settings.heroTitle} className="relative z-10 max-h-80 w-full object-contain" />}
        </div>
      </div>
    </section>
  );
}
