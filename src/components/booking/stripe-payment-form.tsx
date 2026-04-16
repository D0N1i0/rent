"use client";
// src/components/booking/stripe-payment-form.tsx
// Stripe Elements payment form — embedded inside booking confirmation flow.

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// Load Stripe outside of component to avoid recreating on renders
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

interface StripePaymentFormProps {
  clientSecret: string;
  bookingRef: string;
  totalAmount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({
  bookingRef,
  totalAmount,
  onSuccess,
  onCancel,
}: Omit<StripePaymentFormProps, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/confirm?ref=${bookingRef}&paid=1`,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setIsLoading(false);
      return;
    }

    // Payment succeeded without redirect
    onSuccess();
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Secure payment — powered by Stripe</p>
        </div>
        <PaymentElement
          options={{
            layout: "accordion",
            defaultValues: {
              billingDetails: { address: { country: "XK" } },
            },
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-crimson-600 hover:bg-crimson-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Pay €{totalAmount.toFixed(2)}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="sm:w-auto px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Your payment is secured with 256-bit SSL encryption. Card details are never stored on our servers.
      </p>
    </form>
  );
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  const [paid, setPaid] = useState(false);

  if (paid) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <p className="font-bold text-navy-900 text-lg">Payment successful!</p>
        <p className="text-gray-500 text-sm mt-1">
          Booking <span className="font-mono font-bold text-crimson-600">{props.bookingRef}</span> is confirmed.
        </p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#c0392b",
            colorBackground: "#ffffff",
            colorText: "#1a1a2e",
            borderRadius: "8px",
          },
        },
      }}
    >
      <CheckoutForm
        bookingRef={props.bookingRef}
        totalAmount={props.totalAmount}
        onSuccess={() => setPaid(true)}
        onCancel={props.onCancel}
      />
    </Elements>
  );
}
