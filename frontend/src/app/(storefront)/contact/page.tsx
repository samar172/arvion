"use client";

import React, { useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/context/ToastContext";

const inputClass =
  "w-full font-sans text-sm px-3.5 py-3.5 border border-line bg-card rounded-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-gold transition";

export default function ContactPage() {
  const settings = useSettings();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const supportEmail = settings.supportEmail || "care@al-rizvi.com";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(form.subject || `Enquiry from ${form.name}`);
    const body = encodeURIComponent(
      `${form.message}\n\n— ${form.name}\n${form.email}`
    );
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    toast("Opening your mail app…");
  };

  const whatsapp = settings.whatsapp?.replace(/\D/g, "");

  return (
    <div className="mx-auto max-w-5xl w-full px-4 md:px-7 py-10 md:py-[50px] pb-20 flex-1">
      <h1 className="font-display font-medium text-4xl md:text-[46px] text-ink mb-2.5">
        Contact Us
      </h1>
      <p className="font-sans text-[15px] text-muted mb-9 max-w-lg">
        We&apos;d love to help you find the perfect gift. Reach out and our team will
        respond within 24 hours.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-11 items-start">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
            className={inputClass}
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email address"
            className={inputClass}
          />
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Subject"
            className={inputClass}
          />
          <textarea
            required
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="How can we help?"
            className={`${inputClass} resize-y`}
          />
          <button
            type="submit"
            className="self-start bg-emerald text-cream font-sans text-[13px] tracking-[0.1em] uppercase px-8 py-3.5 rounded-sm hover:bg-emerald-light transition"
          >
            Send Message
          </button>
        </form>

        <div className="flex flex-col gap-5">
          <div className="bg-paper border border-line rounded p-6">
            <h3 className="font-display font-medium text-[22px] text-ink mb-3.5">
              Reach us
            </h3>
            <div className="font-sans text-sm leading-[1.9] text-ink-body flex flex-col">
              {settings.whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald"
                >
                  ✦ WhatsApp: {settings.whatsapp}
                </a>
              )}
              {settings.supportPhone && (
                <a href={`tel:${settings.supportPhone}`} className="hover:text-emerald">
                  ✦ Phone: {settings.supportPhone}
                </a>
              )}
              <a href={`mailto:${supportEmail}`} className="hover:text-emerald">
                ✦ Email: {supportEmail}
              </a>
              <span>✦ Mon–Sat, 10am – 7pm IST</span>
            </div>
          </div>

          {settings.address && (
            <div className="bg-paper border border-line rounded p-6">
              <h3 className="font-display font-medium text-[22px] text-ink mb-3.5">
                Visit our atelier
              </h3>
              <p className="font-sans text-sm leading-[1.9] text-ink-body whitespace-pre-line">
                {settings.address}
              </p>
            </div>
          )}

          {settings.whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="block text-center bg-gold text-emerald font-sans text-[13px] tracking-[0.1em] uppercase py-3.5 rounded-sm hover:bg-gold-light transition"
            >
              Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
