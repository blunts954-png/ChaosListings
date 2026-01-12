import React from 'react';
import Link from 'next/link';
import { Plus, Settings, Users, CreditCard } from 'lucide-react';

const actions = [
  {
    title: 'New Business',
    description: 'Add a new business to manage',
    href: '/businesses/create',
    icon: Plus,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Team Members',
    description: 'Manage your team and permissions',
    href: '/settings/team',
    icon: Users,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Billing',
    description: 'View subscriptions and usage',
    href: '/settings/billing',
    icon: CreditCard,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Settings',
    description: 'Configure your agency',
    href: '/settings/agency',
    icon: Settings,
    color: 'bg-orange-100 text-orange-600',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900">{action.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{action.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
