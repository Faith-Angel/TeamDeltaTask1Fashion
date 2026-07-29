'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Smartphone } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { ordersApi, paymentsApi } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatXAF } from '@/lib/utils';
import { PAYMENT_METHODS } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

type Step = 'payment' | 'confirm' | 'success';

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { items, subtotal, deliveryFee, total, clear, isEmpty } = useCart();
  const [step, setStep] = useState<Step>('payment');
  const [paymentMethod, setPaymentMethod] = useState<'mtn_momo' | 'orange_money'>('mtn_momo');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');

  if (isEmpty && step !== 'success') {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <p className="text-textSecondary mb-4">Your cart is empty.</p>
        <Button asChild className="bg-primary text-white">
          <Link href="/marketplace">Go to Marketplace</Link>
        </Button>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!phone.trim()) {
      setError('Please enter your mobile money number');
      return;
    }
    setError('');
    setIsProcessing(true);

    try {
      // Create order
      const orderRes = await ordersApi.createOrder({
        items: items.map(({ listing, quantity }) => ({
          listingId: listing.id,
          name: listing.name,
          quantity,
          unitPrice: listing.price,
        })),
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
        vendorId: items[0]?.listing.vendorId,
      });

      const newOrderId = orderRes.data.id;

      // Initiate payment
      await paymentsApi.initiatePayment({
        orderId: newOrderId,
        amount: total,
        method: paymentMethod,
        phoneNumber: phone,
      });

      setOrderId(newOrderId);
      clear();
      setStep('success');
    } catch {
      setError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-success" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-textPrimary mb-2">Order Placed!</h1>
        <p className="text-textSecondary text-sm mb-1">Your order has been confirmed.</p>
        <p className="text-xs text-textSecondary mb-6">Order ID: <span className="font-medium text-textPrimary">{orderId}</span></p>
        <div className="flex flex-col gap-2">
          <Button className="bg-primary text-white" onClick={() => router.push('/marketplace')}>
            Continue Shopping
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/cart"
        className="inline-flex items-center gap-1 text-sm text-textSecondary hover:text-primary mb-6"
        aria-label="Back to cart"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to Cart
      </Link>

      <h1 className="text-2xl font-bold text-textPrimary mb-6">Checkout</h1>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        {/* Payment form */}
        <div className="space-y-5">
          {/* Payment method */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="font-semibold text-textPrimary mb-4">Payment Method</h2>
            <div className="space-y-3" role="radiogroup" aria-label="Select payment method">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors min-h-[44px]',
                    paymentMethod === m.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.value}
                    checked={paymentMethod === m.value}
                    onChange={() => setPaymentMethod(m.value)}
                    className="sr-only"
                    aria-label={m.label}
                  />
                  <span className="text-xl" aria-hidden="true">{m.icon}</span>
                  <span className="text-sm font-medium text-textPrimary">{m.label}</span>
                  {paymentMethod === m.value && (
                    <CheckCircle className="w-4 h-4 text-primary ml-auto" aria-hidden="true" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Mobile number */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="font-semibold text-textPrimary mb-3">Mobile Number</h2>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" aria-hidden="true" />
              <Input
                className="pl-9"
                type="tel"
                placeholder="+237XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-label="Mobile money phone number"
              />
            </div>
            {error && (
              <p className="text-error text-xs mt-2" role="alert">{error}</p>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-surface rounded-xl border border-border p-5 h-fit" aria-label="Order summary">
          <h2 className="font-semibold text-textPrimary mb-4">Order Summary</h2>
          <ul className="space-y-2 mb-4" aria-label="Items in order">
            {items.map(({ listing, quantity }) => (
              <li key={listing.id} className="flex justify-between text-sm">
                <span className="text-textSecondary truncate mr-2">{listing.name} ×{quantity}</span>
                <span className="text-textPrimary font-medium flex-shrink-0">{formatXAF(listing.price * quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 text-sm border-t border-border pt-3">
            <div className="flex justify-between">
              <dt className="text-textSecondary">Subtotal</dt>
              <dd>{formatXAF(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-textSecondary">Delivery</dt>
              <dd>{formatXAF(deliveryFee)}</dd>
            </div>
            <div className="flex justify-between font-bold text-primary border-t border-border pt-2 mt-1">
              <dt>Total</dt>
              <dd>{formatXAF(total)}</dd>
            </div>
          </dl>

          <Button
            className="w-full bg-primary text-white mt-5"
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            aria-label="Place order and pay"
          >
            {isProcessing ? 'Processing…' : `Pay ${formatXAF(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
