import React, { useState, useEffect } from 'react';
import { fetchPendingSellers, updateSellerStatus } from '../../services/api';

export default function AdminApprovalsPage({ onRefreshCount, triggerToast }) {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    loadPendingSellers();
  }, []);

  async function loadPendingSellers() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPendingSellers();
      setSellers(data || []);
      if (onRefreshCount) onRefreshCount((data || []).length);
    } catch (err) {
      console.warn('Failed to load live pending sellers:', err.message);
      setError(err.message);
      setSellers([]);
      if (onRefreshCount) onRefreshCount(0);
    } finally {
      setLoading(false);
    }
  }


  async function handleStatusUpdate(seller, newStatus) {
    setActionId(seller.id);
    try {
      if (!seller.id.startsWith('mock-')) {
        await updateSellerStatus(seller.id, newStatus);
      }
      setSellers((prev) =>
        prev.map((s) => (s.id === seller.id ? { ...s, current_status: newStatus } : s))
      );
      if (onRefreshCount) {
        const remaining = sellers.filter(
          (s) => s.id !== seller.id && s.current_status === 'PENDING'
        ).length;
        onRefreshCount(remaining);
      }
      if (triggerToast) {
        triggerToast(
          `Verification status for "${seller.business_name}" updated to ${newStatus}! Notification email sent.`,
          newStatus === 'APPROVED' ? 'success' : 'info'
        );
      }
    } catch (err) {
      if (triggerToast) triggerToast(`Error: ${err.message}`, 'error');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Instruction Card */}
      <div className="bg-[#EEF3F2] border border-[#A3C1BF]/40 rounded-lg p-5">
        <h3 className="text-[15px] font-semibold text-black mb-1">🛡️ Verification Protocol</h3>
        <p className="text-[13px] text-[#5B5B58]">
          Review the document uploads and business details submitted by Pakistani suppliers. Approving them tags them as a <strong>Verified Seller</strong> across the marketplace. Denying will mark their request as <strong>Rejected</strong> and notify them via automated email.
        </p>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-lg border border-[#E9E8E2] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-black">Pending Seller Verification Requests</h2>
          <button
            onClick={loadPendingSellers}
            className="text-xs text-[#85A6A3] hover:underline font-medium flex items-center gap-1"
          >
            🔄 Refresh List
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#5B5B58] text-sm font-medium">
            Fetching pending seller applications from backend…
          </div>
        ) : sellers.length === 0 ? (
          <div className="py-12 text-center text-[#85A6A3] text-sm font-medium bg-[#F9F9F6] rounded-lg border border-[#E9E8E2]">
            ✓ No pending seller verification requests. All applications processed!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E9E8E2] text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider pb-3">
                  <th className="pb-3">Supplier Name</th>
                  <th className="pb-3">Details / Tax ID</th>
                  <th className="pb-3">Business Region</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E8E2]">
                {sellers.map((seller) => {
                  const initials = seller.business_name
                    ? seller.business_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'SP';
                  const isPending = seller.current_status === 'PENDING';
                  const isApproved = seller.current_status === 'APPROVED';

                  return (
                    <tr key={seller.id} className="text-[14px] hover:bg-[#F9F9F6]/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-sm font-bold text-black shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium text-black">{seller.business_name}</div>
                            <div className="text-[12px] text-[#5B5B58]">
                              {seller.users?.email || seller.email || 'No email provided'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4">
                        <div className="text-[13px] text-black">{seller.tax_id || 'NTN & Registration'}</div>
                        <span className="text-[11px] text-[#85A6A3] font-medium underline cursor-pointer">
                          View Docs
                        </span>
                      </td>

                      <td className="py-4 text-[#5B5B58]">
                        {seller.business_address || 'Pakistan'}
                      </td>

                      <td className="py-4 text-center">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C6564D] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                            Pending
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#85A6A3] bg-[#EEF3F2] px-2.5 py-0.5 rounded-full border border-[#A3C1BF]/30">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5B5B58] bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-4 text-right">
                        {isPending ? (
                          <div className="inline-flex gap-2">
                            <button
                              disabled={actionId === seller.id}
                              onClick={() => handleStatusUpdate(seller, 'APPROVED')}
                              className="px-3 py-1.5 bg-[#A3C1BF] hover:bg-[#85A6A3] text-black rounded-md text-[12px] font-medium transition-colors disabled:opacity-50"
                            >
                              {actionId === seller.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              disabled={actionId === seller.id}
                              onClick={() => handleStatusUpdate(seller, 'REJECTED')}
                              className="px-3 py-1.5 border border-[#E9E8E2] hover:bg-[#F9F9F6] text-[#5B5B58] rounded-md text-[12px] font-medium transition-colors disabled:opacity-50"
                            >
                              Deny
                            </button>
                          </div>
                        ) : (
                          <span className="text-[12px] text-[#85A6A3] font-medium">
                            Processed ({seller.current_status})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
