'use client';

import NextLink from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode, type ComponentProps } from 'react';

type NavigateOptions = {
  replace?: boolean;
  state?: { from?: string };
};

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
  to?: string;
  href?: string;
  children?: ReactNode;
};

/** Drop-in replacements for react-router-dom (Next.js App Router). */
export function Link({ to, href, children, ...props }: LinkProps) {
  return (
    <NextLink href={href ?? to ?? '/'} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (to: string, options?: NavigateOptions) => {
    if (options?.state?.from) {
      sessionStorage.setItem('navFrom', options.state.from);
    }
    if (options?.replace) router.replace(to);
    else router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname() || '/';
  let state: { from?: string } | null = null;
  if (typeof window !== 'undefined') {
    const from = sessionStorage.getItem('navFrom');
    if (from) state = { from };
  }
  return { pathname, state };
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [router, to, replace]);
  return null;
}

export function Outlet({ children }: { children?: ReactNode }) {
  return children;
}
