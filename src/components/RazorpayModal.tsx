import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, ShieldCheck, X, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  purpose: string;
  defaultAmount?: number;
  goalId?: string;
  policyId?: string;
  isEmergencyFund?: boolean;
  onSuccess: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  onClose,
  title,
  purpose,
  defaultAmount = 5000,
  goalId,
  policyId,
  isEmergencyFund,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number | ''>(defaultAmount);
  const [rzpStatus, setRzpStatus] = useState<{ configured: boolean; keyId: string | null; message: string } | null>(
    null
  );
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setAmount(defaultAmount);
      setStatusMessage(null);
    }
  }, [isOpen, defaultAmount]);

  const checkStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await api.getRazorpayStatus();
      setRzpStatus(res);
    } catch {
      setRzpStatus({
        configured: false,
        keyId: null,
        message: 'Could not connect to payment gateway service.',
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  if (!isOpen) return null;

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid contribution amount.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      // 1. Create order on server
      const orderRes = await api.createRazorpayOrder({
        amount: numAmount,
        purpose,
        entityId: goalId || policyId || (isEmergencyFund ? 'emergency_fund' : undefined),
      });

      // 2. If Razorpay SDK script is loaded in browser, launch checkout modal
      const options = {
        key: orderRes.keyId || (rzpStatus?.keyId ?? 'rzp_test_placeholder'),
        amount: orderRes.amount,
        currency: orderRes.currency || 'INR',
        name: 'SmartSpend Financial Platform',
        description: purpose,
        order_id: orderRes.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await api.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id || orderRes.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              purpose,
              amount: numAmount,
              goalId,
              policyId,
              isEmergencyFund,
            });

            setStatusMessage({
              type: 'success',
              text: `Payment verified successfully! Txn ID: ${verifyRes.paymentId}.`,
            });
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 1800);
          } catch (verErr: any) {
            setStatusMessage({
              type: 'error',
              text: verErr.message || 'Payment signature verification failed.',
            });
          }
        },
        prefill: {
          name: 'Demo User',
          email: 'demo@smartspend.io',
          contact: '9999999999',
        },
        theme: {
          color: '#4f46e5',
        },
      };

      // Check if Razorpay is loaded in window
      if (typeof (window as any).Razorpay !== 'undefined') {
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setStatusMessage({
            type: 'error',
            text: `Payment failed: ${response.error?.description || 'Transaction cancelled'}`,
          });
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        setStatusMessage({
          type: 'info',
          text: `Order ${orderRes.id} created in Razorpay Test Mode! To complete the browser popup checkout, ensure test credentials are authenticated.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text:
          err.message ||
          'Failed to create Razorpay test order. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-400 font-medium">{purpose}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gateway Status Badge */}
        <div
          className={`p-3 rounded-2xl border text-xs flex items-start space-x-2.5 ${
            rzpStatus?.configured
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          {rzpStatus?.configured ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <span className="font-bold block">
              {rzpStatus?.configured ? 'Razorpay Test Mode Connected' : 'Razorpay Gateway Unconfigured'}
            </span>
            <p className="text-[11px] leading-relaxed opacity-90">
              {rzpStatus?.configured
                ? `Key: ${rzpStatus.keyId}. Live test orders will be dispatched to Razorpay's API.`
                : 'Set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in .env to dispatch live test orders.'}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-start space-x-2 font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-indigo-50 border border-indigo-200 text-indigo-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleInitiatePayment} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Payment / Contribution Amount (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="1"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="5000"
                required
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[2000, 5000, 10000, 25000].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors"
                >
                  +₹{preset.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || isLoadingStatus}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Proceed to Pay ₹{Number(amount || 0).toLocaleString('en-IN')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
