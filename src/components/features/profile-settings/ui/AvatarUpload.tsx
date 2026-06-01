"use client";

import { useRef } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  user: {
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    imageUrl: string;
    emailAddresses: Array<{ emailAddress: string }>;
  } | null | undefined;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function AvatarUpload({ user, onUpload, isUploading }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.fullName || user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Kullanıcı";

  const avatarUrl = user.imageUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
    }
  };

  const triggerFileInput = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        onClick={triggerFileInput}
        className={`relative w-28 h-28 rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 border-2 ${
          isUploading
            ? "border-cyan-500 animate-pulse"
            : "border-indigo-500/30 hover:border-cyan-500/80 hover:shadow-[0_0_20px_rgba(8,145,178,0.2)]"
        }`}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            sizes="112px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-cyan-600 text-white font-black text-2xl">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        
        {/* Overlay hover effect */}
        <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          ) : (
            <>
              <Camera className="w-6 h-6 text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Değiştir</span>
            </>
          )}
        </div>
        
        {isUploading && (
          <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        )}
      </div>

      <input 
        ref={fileInputRef}
        id="avatar-file-input"
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileChange}
        disabled={isUploading}
        aria-label="Profil Fotoğrafı Seç"
      />

      <div className="text-center">
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="text-xs font-bold text-cyan-500 hover:text-cyan-400 transition-colors uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          Fotoğraf Seç
        </button>
        <p className="text-[10px] text-slate-500 mt-1">PNG, JPG veya GIF (En fazla 5MB)</p>
      </div>
    </div>
  );
}
