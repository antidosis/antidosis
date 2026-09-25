import { redirect } from "next/navigation";

// Pro is retired — verification is the trust layer now.
export default function ProPage() {
  redirect("/dashboard");
}
