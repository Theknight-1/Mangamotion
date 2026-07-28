"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

interface VerifyToastProps {
  verified?: string;
  error?: string;
}

export function VerifyToast({ verified, error }: VerifyToastProps) {
  useEffect(() => {
    if (verified === "true") {
      toast.success("Email verified! You can now sign in.", {
        duration: 5000,
        icon: "🎉",
      });
    } else if (error === "invalid_token") {
      toast.error("Verification link is invalid or expired.", {
        duration: 6000,
      });
    } else if (error) {
      toast.error("Verification failed. Please try again.", {
        duration: 6000,
      });
    }
  }, []); // empty deps — only runs once on mount

  return null;
}
