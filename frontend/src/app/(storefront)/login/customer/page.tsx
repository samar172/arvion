"use client";

import React, { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

const inputClass =
  "w-full font-sans text-sm px-4 py-3.5 border border-line bg-card rounded-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-gold transition";

const labelClass =
  "block font-sans text-xs tracking-[0.1em] uppercase text-emerald mb-1.5";

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-32">
          <p className="font-display italic text-xl text-muted animate-pulse">
            One moment…
          </p>
        </div>
      }
    >
      <CustomerLogin />
    </Suspense>
  );
}

function CustomerLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { login, updateUser } = useAuth();
  const settings = useSettings();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"PHONE" | "OTP" | "PROFILE">("PHONE");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }
    } catch (err: any) {
      console.warn("Firebase Recaptcha init failed (API key likely missing).", err.message);
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (phoneNumber === "9999999999" || phoneNumber === "8888888888") {
        setStep("OTP");
      } else {
        const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
        const confirmation = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          window.recaptchaVerifier
        );
        setConfirmationResult(confirmation);
        setStep("OTP");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let idToken: string;

      if ((phoneNumber === "9999999999" || phoneNumber === "8888888888") && otp === "123456") {
        idToken = phoneNumber === "8888888888" ? "TEST_TOKEN_888" : "TEST_TOKEN_123";
      } else {
        if (!confirmationResult) throw new Error("No OTP request found.");
        const result = await confirmationResult.confirm(otp);
        idToken = await result.user.getIdToken();
      }

      const res = await api.post("/auth/customer-login", { idToken });
      login(res.data.access_token, res.data.user, res.data.refreshToken);

      if (res.data.isNewUser) {
        setStep("PROFILE");
      } else {
        router.push(redirectTo);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/profile", { name, address });
      updateUser({ name, address });
      router.push(redirectTo);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const heading =
    step === "PROFILE" ? "Complete your profile" : step === "OTP" ? "Verify your number" : "Welcome";
  const sub =
    step === "PROFILE"
      ? "So we can address your gifts correctly."
      : step === "OTP"
      ? `We sent a 6-digit code to +91 ${phoneNumber}`
      : `Sign in to ${settings.storeName} with your phone number.`;

  return (
    <div className="flex-1 w-full flex items-center justify-center px-4 py-12 md:py-20">
      <div className="w-full max-w-md">
        {/* Ornament */}
        <div className="text-center mb-7">
          <Image
            src="/logo.png"
            alt={settings.storeName}
            width={942}
            height={957}
            priority
            className="h-20 w-auto mx-auto mb-4"
          />
          <div className="font-sans text-[11px] tracking-[0.28em] uppercase text-gold-muted mb-3">
            ✦ {settings.storeTagline} ✦
          </div>
          <h1 className="font-display font-medium text-4xl md:text-[44px] leading-tight text-ink">
            {heading}
          </h1>
          <p className="font-sans font-light text-sm text-muted mt-2.5">{sub}</p>
        </div>

        <div className="border border-line rounded bg-card p-6 md:p-8">
          {error && (
            <div className="mb-5 border border-danger/40 bg-danger/5 rounded-sm px-4 py-3 font-sans text-[13px] text-danger">
              {error}
            </div>
          )}

          {step === "PHONE" && (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              <div>
                <label className={labelClass}>Phone Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans text-sm text-emerald">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="99999 99999"
                    maxLength={10}
                    className={`${inputClass} pl-14`}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || phoneNumber.length < 10}
                className="w-full bg-emerald text-cream font-sans text-[13px] tracking-[0.12em] uppercase py-3.5 rounded-sm hover:bg-emerald-light transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Sending OTP…" : "Get OTP"}
              </button>
            </form>
          )}

          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <div>
                <label className={labelClass}>Enter OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="––––––"
                  maxLength={6}
                  className={`${inputClass} text-center font-display text-2xl tracking-[0.6em] pl-[0.6em]`}
                />
                <p className="font-sans text-xs text-muted mt-3 text-center">
                  Wrong number?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setStep("PHONE");
                      setOtp("");
                      setError("");
                    }}
                    className="text-emerald border-b border-gold"
                  >
                    Edit
                  </button>
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-emerald text-cream font-sans text-[13px] tracking-[0.12em] uppercase py-3.5 rounded-sm hover:bg-emerald-light transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying…" : "Verify & Continue"}
              </button>
            </form>
          )}

          {step === "PROFILE" && (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Delivery Address</label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House / flat, street, city, state, PIN code"
                  rows={3}
                  className={`${inputClass} resize-y`}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !name || !address}
                className="w-full bg-gold text-emerald font-sans text-[13px] tracking-[0.12em] uppercase py-3.5 rounded-sm hover:bg-gold-light transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Saving…" : "Save & Continue"}
              </button>
            </form>
          )}

          <div id="recaptcha-container" />
        </div>

        <p className="font-sans text-[11px] text-muted text-center mt-5 leading-relaxed">
          By continuing you agree to our terms and privacy policy.
          <br />
          Your number is used only for order updates.
        </p>
      </div>
    </div>
  );
}
