"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function useProfileSettings() {
  const { user, isLoaded } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Temel kullanıcı bilgileri durumları
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hasPhone, setHasPhone] = useState(false);
  const [username, setUsername] = useState("");

  // CRM Pazarlama / İletişim Tercihleri Durumları
  const [marketingSms, setMarketingSms] = useState(false);
  const [marketingEmail, setMarketingEmail] = useState(false);

  // Değişiklik tespiti için başlangıç değerleri
  const [initialState, setInitialState] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    marketingSms: false,
    marketingEmail: false,
  });

  useEffect(() => {
    if (isLoaded && user) {
      const fName = user.firstName || "";
      const lName = user.lastName || "";
      const primaryEmail = user.emailAddresses?.[0]?.emailAddress || "";
      const userUsername = user.username || "";

      // Clerk unsafeMetadata içerisinden CRM tercihlerini ve telefonu oku
      const metadata = user.unsafeMetadata || {};
      const smsOptIn = !!metadata.marketingSms;
      const emailOptIn = !!metadata.marketingEmail;
      
      const userPhone = user.phoneNumbers?.[0]?.phoneNumber || (metadata.phone as string) || "";

      const timer = setTimeout(() => {
        setFirstName(fName);
        setLastName(lName);
        setEmail(primaryEmail);
        setUsername(userUsername);
        setPhone(userPhone);
        setHasPhone(!!userPhone);
        setMarketingSms(smsOptIn);
        setMarketingEmail(emailOptIn);

        setInitialState({
          firstName: fName,
          lastName: lName,
          phone: userPhone,
          marketingSms: smsOptIn,
          marketingEmail: emailOptIn,
        });
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, user]);

  const isFormChanged =
    firstName !== initialState.firstName ||
    lastName !== initialState.lastName ||
    phone !== initialState.phone ||
    marketingSms !== initialState.marketingSms ||
    marketingEmail !== initialState.marketingEmail;

  // Atomik updateProfile fonksiyonu
  const updateProfile = async (
    newFirstName: string,
    newLastName: string,
    newPhone: string,
    smsAllowed: boolean,
    emailAllowed: boolean
  ) => {
    if (!isLoaded || !user) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Clerk profil verilerini ve unsafeMetadata alanlarını tek bir API isteğinde güncelle
      await user.update({
        firstName: newFirstName,
        lastName: newLastName,
        unsafeMetadata: {
          ...user.unsafeMetadata,
          phone: newPhone,
          marketingSms: smsAllowed,
          marketingEmail: emailAllowed,
        },
      });

      // Yerel durumları güncelle
      setFirstName(newFirstName);
      setLastName(newLastName);
      setPhone(newPhone);
      setHasPhone(!!newPhone);
      setMarketingSms(smsAllowed);
      setMarketingEmail(emailAllowed);

      setInitialState({
        firstName: newFirstName,
        lastName: newLastName,
        phone: newPhone,
        marketingSms: smsAllowed,
        marketingEmail: emailAllowed,
      });

      setSuccess(true);
    } catch (err: unknown) {
      console.error("[useProfileSettings] Error updating profile:", err);
      const message = err instanceof Error ? err.message : "Profil güncellenirken beklenmedik bir hata oluştu.";
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Profil Resmi Yükleme Mekanizması
  const uploadAvatar = async (file: File) => {
    if (!isLoaded || !user) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await user.setProfileImage({ file });
      setSuccess(true);
    } catch (err: unknown) {
      console.error("[useProfileSettings] Error uploading avatar:", err);
      const message = err instanceof Error ? err.message : "Profil resmi yüklenirken bir hata oluştu.";
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    user,
    username,
    phone,
    hasPhone,
    isSaving,
    isUploading,
    uploadAvatar,
    email,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    marketingSms,
    setMarketingSms,
    marketingEmail,
    setMarketingEmail,
    isFormChanged,
    error,
    success,
    updateProfile,
    isLoaded,
  };
}