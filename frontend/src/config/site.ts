export const siteConfig = {
  name: 'Resurs Admin',
  description: 'Admin panel for managing Telegram bot resources',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
};

export const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Resources',
    href: '/resources',
    icon: 'FileText',
  },
  {
    title: 'Users',
    href: '/users',
    icon: 'Users',
  },
  {
    title: 'Broadcasts',
    href: '/broadcasts',
    icon: 'Send',
  },
] as const;
