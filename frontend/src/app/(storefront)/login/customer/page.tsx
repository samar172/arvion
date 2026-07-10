"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function CustomerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { login, updateUser } = useAuth();
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
        // Bypass OTP sending for static test account
        setStep("OTP");
      } else {
        // Ensure phone number has country code (e.g., +91 for India)
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
        
        // Verify OTP with Firebase
        const result = await confirmationResult.confirm(otp);
        
        // Get Firebase ID Token
        idToken = await result.user.getIdToken();
      }

      // Send to our backend to get standard JWT
      const res = await api.post("/auth/customer-login", { idToken });
      
      // Update the central AuthContext
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

  return (
    <div className="flex-1 w-full bg-surface min-h-[70vh] flex flex-col items-center justify-center p-container-margin relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-lg shadow-sm border border-outline-variant relative overflow-hidden">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">
              {step === "PROFILE" ? "person_add" : "smartphone"}
            </span>
          </div>
          <h1 className="text-display-sm font-extrabold text-on-surface">
            {step === "PROFILE" ? "Complete Profile" : "Welcome Back"}
          </h1>
          <p className="text-body-md text-outline mt-2">
            {step === "PROFILE" ? "Tell us a bit about yourself" : "Login or signup to continue"}
          </p>
        </div>

        {error && (
          <div className="bg-error/10 text-error p-3 rounded-lg text-body-sm font-medium mb-6">
            {error}
          </div>
        )}

        {step === "PHONE" && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-label-lg font-bold text-on-surface mb-2">Phone Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface font-bold">+91</span>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="99999 99999"
                  className="w-full bg-surface rounded-xl pl-12 pr-4 py-3 text-body-lg text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || phoneNumber.length < 10}
              className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold text-label-lg shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Sending OTP..." : "Get OTP"}
            </button>
          </form>
        )}

        {step === "OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-label-lg font-bold text-on-surface mb-2">Enter OTP</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="0 0 0 0 0 0"
                maxLength={6}
                className="w-full bg-surface rounded-xl px-4 py-3 text-center tracking-[1em] text-title-lg font-bold text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
              />
              <p className="text-center text-body-sm text-outline mt-3">
                Sent to +91 {phoneNumber}{" "}
                <button type="button" onClick={() => setStep("PHONE")} className="text-primary font-bold hover:underline">
                  Edit
                </button>
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold text-label-lg shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
          </form>
        )}

        {step === "PROFILE" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label className="block text-label-lg font-bold text-on-surface mb-2">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-surface rounded-xl px-4 py-3 text-body-lg text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-label-lg font-bold text-on-surface mb-2">Delivery Address</label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full delivery address, floor, building..."
                rows={3}
                className="w-full bg-surface rounded-xl px-4 py-3 text-body-lg text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !name || !address}
              className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold text-label-lg shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Saving..." : "Save & Continue"}
            </button>
          </form>
        )}
        
        {/* Invisible Recaptcha */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
