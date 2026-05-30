"use client";

import { InvitedBossesList } from "../ui/InvitedBossesList";
import { InvitedBoss } from "../types";

interface InvitedBossesSectionProps {
  state: {
    invitedBosses: InvitedBoss[];
    isDarkMode: boolean;
  };
  actions: {
    handleRevokeBoss: (id: string, organizationId?: string) => Promise<void>;
  };
}

export function InvitedBossesSection({ state, actions }: InvitedBossesSectionProps) {
  const { invitedBosses, isDarkMode } = state;
  const { handleRevokeBoss } = actions;

  return (
    <div className="max-w-screen-xl mx-auto">
      <InvitedBossesList
        bosses={invitedBosses}
        isDarkMode={isDarkMode}
        onRevoke={handleRevokeBoss}
      />
    </div>
  );
}
