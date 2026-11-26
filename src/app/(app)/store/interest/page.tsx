import { redirect } from "next/navigation";

/** Folded into the single storefront — kept so old links and SEO equity land correctly. */
export default function StoreInterestRedirect() {
  redirect("/store#interest");
}
