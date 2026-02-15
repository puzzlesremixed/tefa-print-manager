import '@inertiajs/core';
declare module '@inertiajs/core' {
  interface PageProps {
    name: string;
    auth: {
      user: unknown | null;
    };
    sidebarOpen: boolean;

    messages?: {
      success?: string | null;
      error?: string | null;
      info?: string | null;
      warning?: string | null;
    };
  }
}