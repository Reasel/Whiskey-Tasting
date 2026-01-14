import React from 'react';

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen flex flex-col">{children}</main>;
}
