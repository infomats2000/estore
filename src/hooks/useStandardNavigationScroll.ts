import { useEffect } from 'react';

const visibleDialogs = () => Array.from(document.querySelectorAll<HTMLElement>(
  '[role="dialog"], [aria-modal="true"], .fixed.inset-0'
)).filter(element => element.getClientRects().length > 0);

const resetDialogScroll = (dialog: HTMLElement) => {
  dialog.scrollTop = 0;
  dialog.querySelectorAll<HTMLElement>('.overflow-y-auto, .overflow-auto').forEach(element => {
    element.scrollTop = 0;
  });
  const panel = dialog.firstElementChild as HTMLElement | null;
  if (panel) panel.scrollTop = 0;
};

/** Keeps page, target and dialog navigation aligned with common web-app scroll behaviour. */
export function useStandardNavigationScroll() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const trigger = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        'a, button, [role="link"], [role="tab"], [data-scroll-target]'
      );
      if (!trigger) return;

      const dialogsBefore = new Set(visibleDialogs());
      const explicitTarget = trigger.dataset.scrollTarget;
      const href = trigger instanceof HTMLAnchorElement ? trigger.getAttribute('href') : null;
      const isNavigation = trigger.matches('a, [role="link"], [role="tab"], [data-scroll-target]');

      window.setTimeout(() => {
        const newDialog = visibleDialogs().find(dialog => !dialogsBefore.has(dialog));
        if (newDialog) {
          resetDialogScroll(newDialog);
          return;
        }

        const targetSelector = explicitTarget || (href?.startsWith('#') && href.length > 1 ? href : null);
        if (targetSelector) {
          try {
            const target = document.querySelector<HTMLElement>(targetSelector);
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              return;
            }
          } catch {
            // Ignore malformed third-party link targets and use normal page navigation.
          }
        }

        if (isNavigation && (!href || href === '#' || !href.startsWith('#'))) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 0);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);
}

