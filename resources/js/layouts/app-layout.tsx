import { Toaster } from '@/components/ui/sonner';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
  const { messages, errors } = usePage().props;
  const shownRef = useRef(false);
  useEffect(() => {
    if (shownRef.current) return;
    if (messages) {
      if (messages.success) {
        toast.success(messages.success);
        shownRef.current = true;
      } else if (messages.error) {
        toast.error(messages.error);
        shownRef.current = true;
      } else if (messages.info) {
        toast.info(messages.info);
        shownRef.current = true;
      } else if (messages.warning) {
        console.log(messages.warning);
        toast.warning(messages.warning);
        shownRef.current = true;
      } else if (Object.keys(errors).length > 0) {
        toast('Terjadi kesalahan.');
      }
    }
  }, [messages, errors]);

  return (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
      {children}
      <Toaster
        position="top-right"
        richColors
        theme={
          typeof document !== 'undefined' &&
          document.documentElement.classList.contains('dark')
            ? 'dark'
            : 'light'
        }
      />
    </AppLayoutTemplate>
  );
};
