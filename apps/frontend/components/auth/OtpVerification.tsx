"use client";

import { useState } from "react";
import { supabase } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OtpVerificationProps {
  phone: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function OtpVerification({
  phone,
  onBack,
  onSuccess,
}: OtpVerificationProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  const showMessage = (msg: string, type: "error" | "success" = "error") => {
    setMessage(msg);
    setMessageType(type);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });

    if (error) {
      showMessage(error.message, "error");
    } else {
      showMessage("Phone verified successfully!", "success");
      onSuccess();
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({ phone });

    if (error) {
      showMessage(error.message, "error");
    } else {
      showMessage("OTP sent successfully!", "success");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <Card className="w-full max-w-md shadow-2xl border-zinc-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-zinc-100">
            Verify Your Phone
          </CardTitle>
          <p className="text-center text-zinc-400">
            We sent a verification code to {phone}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-zinc-200">
                Verification Code
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-400 text-center text-lg tracking-widest"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-zinc-400 text-sm">Didn't receive the code?</p>
            <Button
              variant="ghost"
              onClick={handleResendOtp}
              disabled={loading}
              className="text-zinc-300 hover:text-white"
            >
              Resend Code
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={onBack}
            className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700"
          >
            Back to Sign In
          </Button>

          {message && (
            <div
              className={`text-center text-sm p-3 rounded-md ${
                messageType === "success"
                  ? "bg-green-900/50 text-green-400 border border-green-800"
                  : "bg-red-900/50 text-red-400 border border-red-800"
              }`}
            >
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
