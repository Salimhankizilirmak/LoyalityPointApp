"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function useProfileSettings() {
  const { user, isLoaded } = useUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  
  const [marketingSms, setMarketingSms] = useState(false);
  const [marketingEmail, setMarketingEmail] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize form state when user loaded
  useEffect(() => {
    if (isLoaded && user) {
      const timer = setTimeout(() => {
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setUsername(user.username || "");
        setEmail(user.emailAddresses?.[0]?.emailAddress || "");
        
        const meta = user.unsafeMetadata || {};
        setMarketingSms(meta.marketingSms === true);
        setMarketingEmail(meta.marketingEmail === true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, user]);

  const updateProfile = async (
    fName: string,
    lName: string,
    smsAllowed: boolean,
    emailAllowed: boolean
  ) => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await user.update({
        firstName: fName.trim(),
        lastName: lName.trim(),
        unsafeMetadata: {
          ...user.unsafeMetadata,
          marketingSms: smsAllowed,
          marketingEmail: emailAllowed,
        }
      });

      setMarketingSms(smsAllowed);
      setMarketingEmail(emailAllowed);
      setSuccess("Profil bilgileri başarıyla güncellendi.");
    } catch (err: unknown) {
      console.error("[useProfileSettings] Update error:", err);
      const message = err instanceof Error ? err.message : "Profil güncellenirken bir hata oluştu.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await user.setProfileImage({ file });
      setSuccess("Profil resmi başarıyla güncellendi.");
    } catch (err: unknown) {
      console.error("[useProfileSettings] Avatar upload error:", err);
      const message = err instanceof Error ? err.message : "Profil resmi yüklenirken bir hata oluştu.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    user,
    isLoaded,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    username,
    setUsername,
    email,
    marketingSms,
    setMarketingSms,
    marketingEmail,
    setMarketingEmail,
    isSaving,
    isUploading,
    error,
    setError,
    success,
    setSuccess,
    updateProfile,
    uploadAvatar,
  };
}

