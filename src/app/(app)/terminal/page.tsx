import type { Metadata } from "next";

import TerminalClient from "./_components/terminal-client";

export const metadata: Metadata = {
  title: "Terminal — antidosis",
  description:
    "The Antidosis terminal. Connect with the community, send direct messages, and reach staff.",
};

export default function TerminalPage() {
  return <TerminalClient />;
}
