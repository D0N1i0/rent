// src/app/(public)/booking/confirm/confirm-labels.tsx
"use client";

import { useT } from "@/lib/i18n/context";
import { CheckCircle } from "lucide-react";

/** Renders the translatable static sections of the booking confirmation page. */
export function ConfirmTitle() {
  const t = useT();
  return <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-900 mb-2">{t.confirm.title}</h1>;
}

export function ConfirmSubtitle() {
  const t = useT();
  return <p className="text-gray-600 mb-4">{t.confirm.subtitle}</p>;
}

export function ConfirmBookingRefLabel() {
  const t = useT();
  return <span className="text-sm font-medium">{t.confirm.bookingRef}:</span>;
}

export function ConfirmBookingDetailsHeading() {
  const t = useT();
  return <h2 className="font-bold text-navy-900 mb-4">{t.confirm.bookingDetails}</h2>;
}

export function ConfirmPickupLabel() {
  const t = useT();
  return <p className="text-xs font-semibold text-gray-500 uppercase">{t.confirm.pickup}</p>;
}

export function ConfirmDropoffLabel() {
  const t = useT();
  return <p className="text-xs font-semibold text-gray-500 uppercase">{t.confirm.dropoff}</p>;
}

export function ConfirmWhatToBring() {
  const t = useT();
  const items = [t.confirm.bringId, t.confirm.bringLicense, t.confirm.bringCard, t.confirm.bringConfirmation];
  return (
    <>
      <h2 className="font-bold text-navy-900 mb-3">{t.confirm.whatToBring}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}

export function ConfirmNeedHelp() {
  const t = useT();
  return (
    <>
      <h2 className="font-bold mb-3">{t.confirm.needHelp}</h2>
      <p className="text-gray-300 text-sm mb-4">{t.confirm.support247} {" Don\u2019t hesitate to reach out."}</p>
    </>
  );
}

export function ConfirmNavLinks() {
  const t = useT();
  return { backHome: t.confirm.backHome, browseMore: t.confirm.browseMore };
}

export function ConfirmFooterLinks() {
  const t = useT();
  return (
    <>
      <span>{t.confirm.backHome}</span>
      <span>{t.confirm.browseMore}</span>
    </>
  );
}
