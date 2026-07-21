import type { Metadata } from "next";

import { DemoShell } from "../_components/demo-shell";
import UserExperienceDemoClient from "./_components/user-experience-demo-client";

export const metadata: Metadata = {
  title: "User Experience Demo — antidosis",
  description:
    "Walk through the full Antidosis user journey: post a need, browse, express interest, negotiate, and complete an exchange.",
};

export default function UserExperienceDemoPage() {
  return (
    <DemoShell>
      <UserExperienceDemoClient />
    </DemoShell>
  );
}
