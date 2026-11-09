import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  CreditCard, Zap, Check, Download, Calendar, DollarSign,
  ArrowRight, Sparkles, TrendingUp, Package, Smartphone
} from 'lucide-react';
import { format } from 'date-fns';

const PLANS = [
  { id: 'free', name: 'Free', price: 0, credits: 10, accounts: 2, color: 'from-gray-600 to-gray-700' },
  { id: 'starter', name: 'Starter', price: 9, credits: 50, accounts: 5, color: 'from-blue-500 to-blue-600', popular: false },
  { id: 'creator_pro', name: 'Creator Pro', price: 19, credits: 200, accounts: 10, color: 'from-indigo-500 to-purple-600', popular: true },
  { id: 'business', name: 'Business', price: 49, credits: 500, accounts: 25, color: 'from-violet-500 to-purple-700' },
  { id: 'agency', name: 'Agency', price: 99, credits: -1, accounts: -1, color: 'from-amber-500 to-orange-600' }
];

const FEATURES = {
  free: ['2 social accounts', '10 AI credits/month', 'Basic scheduling', 'Email support'],
  starter: ['5 social accounts', '50 AI credits/month', 'Advanced scheduling', 'Analytics', 'Email support'],
  creator_pro: ['10 social accounts', '200 AI credits/month', 'AI Video generation', 'Advanced analytics', 'Priority support'],
  business: ['25 social accounts', '500 AI credits/month', 'Team collaboration', 'Campaign automation', 'API access', 'Priority support'],
  agency: ['Unlimited accounts', 'Unlimited AI credits', 'White-label', 'Client management', 'Dedicated support', 'Custom integrations']
};

export default function Billing() {
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState(user?.plan || 'free');
  const queryClient = useQueryClient();

  const { data: subscriptionData } = useQuery('subscription', async () => {
    const { data } = await api.get('/billing/subscription');
    return data;
  });

  const { data: invoicesData } = useQuery('invoices', async () => {
    const { data } = await api.get('/billing/invoices');
    return data;
  });

  const upgradeMut = useMutation(
    (planId) => api.post('/billing/upgrade', { plan: planId }),
    {
      onSuccess: () => {
        toast.success('Plan upgraded successfully!');
        queryClient.invalidateQueries(['subscription', 'auth']);
      },
      onError: () => toast.error('Upgrade failed')
    }
  );

  const subscription = subscriptionData?.subscription;
  const invoices = invoicesData?.invoices || [];
  const [isYearly, setIsYearly] = useState(false);
  const currentPlan = PLANS.find(p => p.id === (user?.plan || 'free'));
  const credits = Math.max(0, (user?.ai_credits || 0) - (user?.ai_credits_used || 0));
  const creditPercent = user?.ai_credits ? Math.round((credits / user.ai_credits) * 100) : 0;

  const buyCredits = useMutation(
    ({ credits, price }) => api.post('/billing/buy-credits', { credits, price }),
    {
      onSuccess: () => {
        toast.success('Credits purchased!');
        queryClient.invalidateQueries(['subscription', 'auth']);
      },
      onError: () => toast.error('Purchase failed')
    }
  );

  const cancelSub = useMutation(
    () => api.post('/billing/cancel'),
    {
      onSuccess: () => {
        toast.success('Subscription will cancel at period end');
        queryClient.invalidateQueries('subscription');
      },
      onError: () => toast.error('Cancellation failed')
    }
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">

      {/* ── Header ─────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your plan, payments and invoices</p>
      </div>

      {/* ── Current Plan ───────────────── */}
      <div className="card bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border-accent-primary/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package size={18} className="text-accent-primary" />
              <h3 className="font-bold text-white">Current Plan</h3>
            </div>
            <p className="text-3xl font-black text-white capitalize mb-1">{currentPlan?.name}</p>
            <p className="text-sm text-gray-400">
              {currentPlan?.price === 0 ? 'Free forever' : `$${currentPlan?.price}/month`}
            </p>
            {subscription?.next_billing_date && (
              <p className="text-xs text-gray-500 mt-2">
                <Calendar size={12} className="inline mr-1" />
                Renews on {format(new Date(subscription.next_billing_date), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 mb-1">AI Credits</p>
            <p className="text-2xl font-bold text-white">{credits}</p>
            <div className="mt-2 w-32 h-1.5 bg-dark-base rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${creditPercent > 20 ? 'bg-gradient-to-r from-accent-primary to-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${creditPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Plans ──────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Available Plans</h2>
          <div className="flex items-center gap-2 text-xs">
            <span className={isYearly ? 'text-gray-500' : 'text-white font-semibold'}>Monthly</span>
            <button
              onClick={() => setIsYearly(v => !v)}
              className={`relative w-11 h-6 rounded-full border transition-colors ${isYearly ? 'bg-accent-primary border-accent-primary' : 'bg-dark-surface border-dark-border'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isYearly ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
            <span className={isYearly ? 'text-accent-primary font-semibold' : 'text-gray-500'}>Yearly (Save 20%)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PLANS.map((plan, i) => {
            const isActive = plan.id === user?.plan;
            return (
              <div
                key={plan.id}
                className={`stat-card relative animate-fade-in-up stagger-${Math.min(i+1,4)} ${
                  plan.popular ? 'ring-2 ring-accent-primary' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent-primary to-emerald-500 text-dark-base px-3 py-1 rounded-full text-[10px] font-bold">
                    POPULAR
                  </div>
                )}

                <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center mb-3`}>
                  {plan.id === 'free' && <Zap size={20} className="text-white" />}
                  {plan.id === 'starter' && <TrendingUp size={20} className="text-white" />}
                  {plan.id === 'creator_pro' && <Sparkles size={20} className="text-white" />}
                  {plan.id === 'business' && <Package size={20} className="text-white" />}
                  {plan.id === 'agency' && <CreditCard size={20} className="text-white" />}
                </div>

                <h3 className="font-bold text-white mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-black text-white">
                    ${isYearly && plan.price > 0 ? Math.round(plan.price * 0.8) : plan.price}
                  </span>
                  <span className="text-sm text-gray-500">/month</span>
                  {isYearly && plan.price > 0 && (
                    <p className="text-[11px] text-accent-primary mt-0.5">billed ${Math.round(plan.price * 0.8 * 12)}/yr</p>
                  )}
                </div>

                <ul className="space-y-2 mb-4 flex-1">
                  {FEATURES[plan.id].map(feature => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-gray-400">
                      <Check size={14} className="text-accent-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isActive ? (
                  <button disabled className="btn btn-secondary btn-sm w-full opacity-50 cursor-not-allowed">
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => upgradeMut.mutate(plan.id)}
                    disabled={upgradeMut.isLoading}
                    className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'} btn-sm w-full`}
                  >
                    {plan.price > (currentPlan?.price || 0) ? 'Upgrade' : 'Downgrade'}
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Payment Method ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 pb-4 border-b border-dark-border mb-4">
            <CreditCard size={18} className="text-accent-primary" />
            <h3 className="font-bold text-white">Payment Method</h3>
          </div>

          {subscription?.payment_method ? (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-dark-surface border border-dark-border">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <CreditCard size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">•••• •••• •••• {subscription.payment_method.last4}</p>
                <p className="text-xs text-gray-500">Expires {subscription.payment_method.exp_month}/{subscription.payment_method.exp_year}</p>
              </div>
              <button className="btn btn-secondary btn-sm">Update</button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-4">No payment method added</p>
              <button className="btn btn-primary">
                <CreditCard size={16} /> Add Payment Method
              </button>
            </div>
          )}
        </div>

        {/* ── AI Credits ─────────────────── */}
        <div className="card">
          <div className="flex items-center gap-2 pb-4 border-b border-dark-border mb-4">
            <Zap size={18} className="text-accent-primary" />
            <h3 className="font-bold text-white">Buy AI Credits</h3>
          </div>

          <div className="space-y-3">
            {[
              { credits: 50, price: 5, bonus: 0 },
              { credits: 150, price: 12, bonus: 10 },
              { credits: 500, price: 35, bonus: 50 }
            ].map(pack => (
              <button
                key={pack.credits}
                onClick={() => buyCredits.mutate(pack)}
                disabled={buyCredits.isLoading}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-dark-border hover:border-accent-primary hover:bg-accent-primary/5 transition-all group disabled:opacity-60"
              >
                <div className="text-left">
                  <p className="font-bold text-white">{pack.credits} Credits</p>
                  {pack.bonus > 0 && (
                    <p className="text-xs text-accent-primary">+{pack.bonus} bonus credits</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">${pack.price}</p>
                  <p className="text-xs text-gray-500">${(pack.price/(pack.credits + pack.bonus)).toFixed(2)}/credit</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Invoices ───────────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 pb-4 border-b border-dark-border mb-4">
          <DollarSign size={18} className="text-accent-primary" />
          <h3 className="font-bold text-white">Billing History</h3>
        </div>

        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 px-2 font-semibold text-gray-500">Date</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-500">Description</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-500">Amount</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-500">Status</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-500">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="border-b border-dark-border hover:bg-dark-hover transition-colors">
                    <td className="py-3 px-2 text-gray-400">{format(new Date(invoice.created_at), 'MMM d, yyyy')}</td>
                    <td className="py-3 px-2 text-white">{invoice.description}</td>
                    <td className="text-right py-3 px-2 text-white font-semibold">${invoice.amount}</td>
                    <td className="text-center py-3 px-2">
                      <span className={`badge ${invoice.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="text-right py-3 px-2">
                      <button className="p-2 text-gray-500 hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors">
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign size={36} className="mx-auto text-gray-700 mb-3" />
            <p className="text-sm text-gray-500">No invoices yet</p>
          </div>
        )}
      </div>

      {/* ── Cancel Subscription ──────── */}
      {user?.plan && user.plan !== 'free' && (
        <div className="card border-red-500/20">
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <span className="text-red-400">⚠</span> Cancel Subscription
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Your subscription will remain active until the end of the current billing period.
          </p>
          <button
            onClick={() => cancelSub.mutate()}
            disabled={cancelSub.isLoading || subscription?.cancel_at_period_end}
            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {subscription?.cancel_at_period_end ? '✓ Cancellation scheduled' : cancelSub.isLoading ? 'Cancelling…' : 'Cancel Subscription'}
          </button>
        </div>
      )}
    </div>
  );
}
