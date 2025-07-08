"use client";

import React from 'react';
import { Plus, Users, Building2, FileText, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WidgetProps } from '@/types/dashboard';

const quickActions = [
  {
    id: 'add-entity',
    label: 'Nouvelle Entité',
    icon: Users,
    href: '/entities/new',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'add-asset',
    label: 'Nouvel Actif',
    icon: Building2,
    href: '/assets/new',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    id: 'reports',
    label: 'Rapports',
    icon: FileText,
    href: '/reports',
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: Settings,
    href: '/settings',
    color: 'bg-gray-500 hover:bg-gray-600'
  }
];

export default function QuickActionsWidget({ config, onInteraction, isPreview }: WidgetProps) {
  const maxActions = config.config?.maxActions || 4;
  const showRecent = config.config?.showRecent || false;

  const handleActionClick = (actionId: string, href: string) => {
    onInteraction('action_click', { actionId, href });
    if (!isPreview) {
      window.location.href = href;
    }
  };

  if (isPreview) {
    return (
      <div className="p-4 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Actions rapides</h3>
          <Zap className="h-4 w-4 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {quickActions.slice(0, 4).map((action) => (
            <div
              key={action.id}
              className={`p-3 rounded-lg text-white text-center cursor-pointer ${action.color}`}
            >
              <action.icon className="h-5 w-5 mx-auto mb-1" />
              <div className="text-xs font-medium">{action.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Actions rapides</h3>
        <Zap className="h-4 w-4 text-gray-400" />
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {quickActions.slice(0, maxActions).map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action.id, action.href)}
            className={`p-3 rounded-lg text-white text-center transition-colors ${action.color} group`}
          >
            <action.icon className="h-5 w-5 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-medium">{action.label}</div>
          </button>
        ))}
      </div>

      {showRecent && (
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs text-gray-500 mb-2">Récent</div>
          <div className="space-y-1">
            <div className="text-xs text-gray-600">• Entité ajoutée (il y a 2h)</div>
            <div className="text-xs text-gray-600">• Actif modifié (hier)</div>
          </div>
        </div>
      )}
    </div>
  );
} 