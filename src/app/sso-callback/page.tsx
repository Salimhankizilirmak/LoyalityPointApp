"use client";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="fixed inset-0 bg-neutral-950 flex items-center justify-center">
      <AuthenticateWithRedirectCallback signUpForceRedirectUrl="/dashboard" />
    </div>
  );
}
