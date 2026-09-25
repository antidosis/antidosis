import type { Metadata } from "next";

import TerminalClient from "./_components/terminal-client";

export const metadata: Metadata = {
  title: "Relay — antidosis",
  description:
    "The Antidosis relay. Tune into community channels, send direct messages, and reach staff.",
};

export default function TerminalPage() {
  return <TerminalClient />;
}
