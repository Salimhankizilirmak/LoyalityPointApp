"use client";

import { BossProfileSettings } from "../ui/BossProfileSettings";

interface ProfileSectionProps {
  pointRate: number;
  validityMonths: number;
  bossName: string;
  orgName: string;
  isDarkMode: boolean;
  handleSaveSettings: (rate: number, validity: number) => Promise<void>;
  handleUpdateMember: (id: string, fName: string, lName: string) => Promise<void>;
  userId: string | undefined;
  savingSettings: boolean;
  settingsSaved: boolean;
}

export function ProfileSection({
  pointRate,
  validityMonths,
  bossName,
  orgName,
  isDarkMode,
  handleSaveSettings,
  handleUpdateMember,
  userId,
  savingSettings,
  settingsSaved
}: ProfileSectionProps) {
  return (
    <BossProfileSettings
      pointRate={pointRate}
      validityMonths={validityMonths}
      bossName={bossName}
      orgName={orgName}
      isDarkMode={isDarkMode}
      onSaveSettings={handleSaveSettings}
      onUpdateName={async (f, l) => {
        if (userId) {
          await handleUpdateMember(userId, f, l);
        }
      }}
      savingSettings={savingSettings}
      settingsSaved={settingsSaved}
    />
  );
}
