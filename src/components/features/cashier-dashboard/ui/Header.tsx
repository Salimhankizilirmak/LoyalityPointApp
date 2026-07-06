"use client";

import { motion } from "framer-motion";
import { UserMenu } from "@/components/ui/UserMenu";

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  branchName: string;

  clerkUser: {
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    imageUrl: string;
    emailAddresses: { emailAddress: string; }[];
  } | null | undefined;
  signOut: () => void;
}

export function Header({
  isDarkMode,
  setIsDarkMode,
  branchName,

  clerkUser,
  signOut,
}: HeaderProps) {
  const headerBg = isDarkMode
    ? "rgba(10,10,10,0.8)"
    : "rgba(255,255,255,0.9)";
  const headerBorder = isDarkMode
    ? "rgba(255,255,255,0.05)"
    : "rgba(0,0,0,0.05)";

  return (
    <header
      className="sticky top-0 z-30 w-full transition-colors duration-300"
      style={{
        background: headerBg,
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${headerBorder}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-end gap-4 relative">
        {/* Sağ: Kontroller */}
        <div className="flex items-center gap-3">
          {/* User Menu */}
          <UserMenu
            user={clerkUser}
            signOut={signOut}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </header>
  );
}
