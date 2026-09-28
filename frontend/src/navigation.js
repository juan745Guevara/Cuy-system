'use client';

import NextLink from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** Drop-in replacements for react-router-dom (Next.js App Router). */
export function Link({ to, href, children, ...props }) {
  return (
    <NextLink href={href ?? to} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (to, options) => {
    if (options?.state?.from) {
      sessionStorage.setItem('navFrom', options.state.from);
    }
    if (options?.replace) router.replace(to);
    else router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname() || '/';
  let state = null;
  if (typeof window !== 'undefined') {
    const from = sessionStorage.getItem('navFrom');
    if (from) state = { from };
  }
  return { pathname, state };
}

export function Navigate({ to, replace }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [router, to, replace]);
  return null;
}

export function Outlet({ children }) {
  return children;
}
