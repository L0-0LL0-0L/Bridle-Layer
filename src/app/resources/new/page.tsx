"use client";

import { AppShell } from "@/components/app-shell";
import { ResourceWizard } from "@/components/resource-wizard";

export default function NewResourcePage() {
  return (
    <AppShell title="Add Resource" kicker="guided binding ritual">
      <ResourceWizard />
    </AppShell>
  );
}
