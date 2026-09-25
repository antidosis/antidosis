import type { Metadata } from "next";

import { DemoShell } from "../_components/demo-shell";
import TerminalDemoClient from "../_components/terminal-demo-client";

export const metadata: Metadata = {
  title: "Relay Demo — antidosis",
  description:
    "Watch a live replay of community members using the Antidosis relay to negotiate exchanges, send DMs, and build trust.",
};

export default function TerminalDemoPage() {
  return (
    <DemoShell>
      <TerminalDemoClient />
    </DemoShell>
  );
}
