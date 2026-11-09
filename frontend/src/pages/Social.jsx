/**
 * Social Media Management page — lives at /social
 * Wraps the existing SocialAccounts component with a proper page header
 * and sub-navigation for future tabs (Inbox, Logs, etc.)
 */

import { useState } from 'react';
import SocialAccounts from './SocialAccounts';
import { Share2, MessageSquare, Activity } from 'lucide-react';

const TABS = [
  { id: 'accounts', label: 'Connected Accounts', icon: Share2 },
  { id: 'inbox',    label: 'Social Inbox',       icon: MessageSquare },
  { id: 'logs',     label: 'Connection Logs',    icon: Activity },
];

function ComingSoon({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center mb-4">
        <MessageSquare className="w-7 h-7 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{label}</h3>
      <p className="text-sm text-gray-500">Coming soon</p>
    </div>
  );
}

export default function Social() {
  const [activeTab, setActiveTab] = useState('accounts');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Social Media</h1>
        <p className="text-sm text-gray-500 mt-0.5">Connect and manage your social accounts</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-dark-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? 'border-accent-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'accounts' && <SocialAccounts />}
      {activeTab === 'inbox'    && <ComingSoon label="Social Inbox" />}
      {activeTab === 'logs'     && <ComingSoon label="Connection Logs" />}
    </div>
  );
}
