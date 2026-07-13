"use client";

import React, { useState } from "react";
import { useSettings } from "@/context/SettingsContext";

const FAQS = [
  {
    q: "What are your best-selling gifts?",
    a: "Our Quran gift sets, couple prayer rugs and personalised name frames are perennial favourites for weddings and Eid.",
  },
  {
    q: "Can I personalise my gift?",
    a: "Yes — many products can be engraved with a name or ayah. Add your text in the gift note at checkout and we will reach out to confirm.",
  },
  {
    q: "Do you ship internationally?",
    a: "We deliver across India and to the UAE, Saudi Arabia, UK, USA, Canada, Australia and more.",
  },
  {
    q: "How long does delivery take?",
    a: "Orders ship in 2–4 business days. Domestic delivery takes 3–6 days; international 7–12 days.",
  },
  {
    q: "What is a Sawab-e-Jariya gift?",
    a: "It is a gift of ongoing blessing — like a Quran or prayer mat — whose reward continues each time it is used.",
  },
  {
    q: "Can non-Muslims give these gifts?",
    a: "Absolutely. Many of our décor pieces, hampers and attars make thoughtful gifts for anyone.",
  },
];

export default function FaqPage() {
  const settings = useSettings();
  const [open, setOpen] = useState<number | null>(0);

  const policies = [
    {
      title: "Shipping Policy",
      text: `Orders are processed in 2–4 business days. Free shipping on orders over ₹${settings.freeShippingThreshold}. Tracking is shared via SMS and email once dispatched.`,
    },
    {
      title: "Return Policy",
      text: "Unused items in original packaging can be returned within 7 days. Personalised and perishable items are non-returnable.",
    },
    {
      title: "Privacy Policy",
      text: "We protect your data and never sell it. Information is used only to process orders and improve your experience.",
    },
    {
      title: "Terms & Conditions",
      text: "By ordering you agree to our terms of sale. Prices are in INR and inclusive of applicable taxes.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl w-full px-4 md:px-7 py-10 md:py-[50px] pb-20 flex-1">
      <h1 className="font-display font-medium text-4xl md:text-[46px] text-ink mb-2">
        Help &amp; Policies
      </h1>
      <p className="font-sans text-[15px] text-muted mb-10">
        Everything you need to know about ordering, shipping and returns.
      </p>

      <h2 className="font-display font-medium text-2xl md:text-[30px] text-emerald mb-4">
        Frequently Asked Questions
      </h2>
      <div className="border-t border-line mb-11">
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={faq.q} className="border-b border-line">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex justify-between items-center gap-4 py-4 px-1 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-sans text-[15px] text-ink">{faq.q}</span>
                <span className="font-display text-2xl text-gold flex-none leading-none">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <p className="font-sans font-light text-sm leading-[1.75] text-muted px-1 pb-4">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {policies.map((p) => (
          <div key={p.title} className="bg-paper border border-line rounded p-6">
            <h3 className="font-display font-medium text-[22px] text-emerald mb-2.5">
              {p.title}
            </h3>
            <p className="font-sans font-light text-sm leading-[1.7] text-muted">
              {p.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
