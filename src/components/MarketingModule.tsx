import React, { useState } from 'react';
import { 
  Percent, Sparkles, ArrowUpRight, MessageSquare, Tag, Plus, Trash2, Star, 
  Users as UsersIcon, Check, X, AlertTriangle, MousePointerClick, TrendingUp
} from 'lucide-react';
import { Coupon, CustomerSegment, UpsellRule, Review, Product } from '../types';

interface MarketingModuleProps {
  coupons: Coupon[];
  onAddCoupon: (coupon: Coupon) => void;
  onToggleCoupon: (code: string) => void;
  customerSegments: CustomerSegment[];
  onAddSegment: (segment: CustomerSegment) => void;
  onDeleteSegment: (id: string) => void;
  upsellRules: UpsellRule[];
  onAddUpsellRule: (rule: UpsellRule) => void;
  onToggleUpsellRule: (id: string) => void;
  onDeleteUpsellRule: (id: string) => void;
  reviews: Review[];
  onDeleteReview: (reviewId: string) => void;
  products: Product[];
}

export const MarketingModule: React.FC<MarketingModuleProps> = ({
  coupons,
  onAddCoupon,
  onToggleCoupon,
  customerSegments,
  onAddSegment,
  onDeleteSegment,
  upsellRules,
  onAddUpsellRule,
  onToggleUpsellRule,
  onDeleteUpsellRule,
  reviews,
  onDeleteReview,
  products
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'coupons' | 'segments' | 'upsells' | 'reviews'>('coupons');

  // Coupon State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponMin, setNewCouponMin] = useState('');

  // Segment State
  const [newSegmentName, setNewSegmentName] = useState('');
  const [newSegmentDescription, setNewSegmentDescription] = useState('');
  const [newSegmentCriteria, setNewSegmentCriteria] = useState('');

  // Upsell State
  const [newUpsellTriggerId, setNewUpsellTriggerId] = useState('');
  const [newUpsellOfferId, setNewUpsellOfferId] = useState('');
  const [newUpsellDiscount, setNewUpsellDiscount] = useState('');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode || !newCouponValue) return;
    onAddCoupon({
      code: newCouponCode.toUpperCase(),
      type: newCouponType,
      value: parseFloat(newCouponValue),
      minPurchase: newCouponMin ? parseFloat(newCouponMin) : undefined,
      active: true
    });
    setNewCouponCode('');
    setNewCouponValue('');
    setNewCouponMin('');
  };

  const handleCreateSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSegmentName) return;
    onAddSegment({
      id: 'seg-' + Date.now(),
      name: newSegmentName,
      description: newSegmentDescription,
      criteria: newSegmentCriteria,
      memberCount: Math.floor(Math.random() * 50) + 5
    });
    setNewSegmentName('');
    setNewSegmentDescription('');
    setNewSegmentCriteria('');
  };

  const handleCreateUpsell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpsellTriggerId || !newUpsellOfferId) return;
    onAddUpsellRule({
      id: 'upsell-' + Date.now(),
      triggerProductId: newUpsellTriggerId,
      upsellProductId: newUpsellOfferId,
      discountPercent: parseFloat(newUpsellDiscount) || 10,
      active: true
    });
    setNewUpsellTriggerId('');
    setNewUpsellOfferId('');
    setNewUpsellDiscount('');
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
        {[
          { id: 'coupons', label: 'Coupons', icon: Percent },
          { id: 'segments', label: 'Segments', icon: Sparkles },
          { id: 'upsells', label: 'Upsell Rules', icon: ArrowUpRight },
          { id: 'reviews', label: 'Reviews', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Coupon Management */}
      {activeSubTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-600" /> New Coupon
              </h3>
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value)}
                    placeholder="E.G. SUMMER20"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCouponType('percent')}
                      className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                        newCouponType === 'percent'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-500'
                      }`}
                    >
                      Percent (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCouponType('fixed')}
                      className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                        newCouponType === 'fixed'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-500'
                      }`}
                    >
                      Fixed ($)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Value</label>
                  <input
                    type="number"
                    required
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors"
                >
                  Create Coupon
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Benefit</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{c.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {c.type === 'percent' ? `${c.value}% Off` : `$${c.value} Off`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {c.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onToggleCoupon(c.code)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg border transition-all ${
                            c.active 
                              ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {c.active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customer Segments */}
      {activeSubTab === 'segments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" /> New Segment
              </h3>
              <form onSubmit={handleCreateSegment} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Segment Name</label>
                  <input
                    type="text"
                    required
                    value={newSegmentName}
                    onChange={(e) => setNewSegmentName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Criteria</label>
                  <select
                    value={newSegmentCriteria}
                    onChange={(e) => setNewSegmentCriteria(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select Criteria</option>
                    <option value="high_value">High Lifetime Value</option>
                    <option value="recent_buyers">Recent Buyers (30d)</option>
                    <option value="at_risk">At Risk (No orders 90d)</option>
                    <option value="returning">Repeat Customers</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                >
                  Define Segment
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerSegments.map((s) => (
              <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                  <button 
                    onClick={() => onDeleteSegment(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{s.description || 'Custom customer segmentation based on purchase behavior.'}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <UsersIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-700">{s.memberCount} Users</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                    {s.criteria.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upsell Rules */}
      {activeSubTab === 'upsells' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" /> New Upsell Rule
              </h3>
              <form onSubmit={handleCreateUpsell} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Trigger Product</label>
                  <select
                    required
                    value={newUpsellTriggerId}
                    onChange={(e) => setNewUpsellTriggerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select Trigger</option>
                    {products.slice(0, 10).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Offer Product</label>
                  <select
                    required
                    value={newUpsellOfferId}
                    onChange={(e) => setNewUpsellOfferId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select Recommended</option>
                    {products.slice(10, 20).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                >
                  Activate Rule
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-3">
            {upsellRules.map((rule) => {
              const trigger = products.find(p => p.id === rule.triggerProductId);
              const offer = products.find(p => p.id === rule.upsellProductId);
              return (
                <div key={rule.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-left">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">When Customer Buys</div>
                      <div className="text-xs font-bold text-slate-900">{trigger?.name || 'Unknown Item'}</div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-300 shrink-0" />
                    <div className="text-left">
                      <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Recommend (Upsell)</div>
                      <div className="text-xs font-bold text-slate-900">{offer?.name || 'Unknown Item'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                        {rule.discountPercent}% OFF
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleUpsellRule(rule.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          rule.active 
                            ? 'bg-emerald-100 border-emerald-200 text-emerald-700' 
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => onDeleteUpsellRule(rule.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews Management */}
      {activeSubTab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyan-600" /> Customer Moderation
            </h4>
            <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
              {reviews.length} Total Reviews
            </span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {reviews.map((rev) => {
              const prod = products.find(p => p.id === rev.productId);
              return (
                <div key={rev.id} className="p-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-3">
                      <img src={rev.avatar} className="h-8 w-8 rounded-full object-cover border border-slate-200" alt={rev.userName} />
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{rev.userName}</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-2.5 w-2.5 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed italic">"{rev.comment}"</p>
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
                          <span className="font-bold text-blue-500">{prod?.name || 'Deleted Product'}</span>
                          <span>•</span>
                          <span>{rev.date}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteReview(rev.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
