import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";

import { ProductDetail, type ProductPageData } from "./_components/product-detail";

export const dynamic = "force-dynamic";

const siteUrl = "https://antidosis.com";

async function loadProduct(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const product = await prisma.meshProduct.findUnique({
    where: { id },
    include: {
      builder: {
        select: {
          businessName: true,
          suburb: true,
          website: true,
          status: true,
          profile: {
            select: { id: true, handle: true, fullName: true, avatarUrl: true, isVerified: true },
          },
        },
      },
    },
  });
  if (!product || product.builder.status !== "approved") return null;
  return product;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) return { title: "Listing unavailable" };
  const price =
    product.priceAudCents === null
      ? "POA"
      : `AU$${(product.priceAudCents / 100).toFixed(product.priceAudCents % 100 === 0 ? 0 : 2)}`;
  const title = `${product.name} — ${price} · ${product.builder.businessName}`;
  const description = product.description.slice(0, 160);
  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "en_AU",
      url: `${siteUrl}/store/product/${product.id}`,
      siteName: "antidosis",
      title,
      description,
      images: [{ url: "/images/social-card.png", width: 1200, height: 630, alt: product.name }],
    },
    alternates: { canonical: `${siteUrl}/store/product/${product.id}` },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();

  const { builder, ...listing } = product;
  const data: ProductPageData = {
    id: listing.id,
    name: listing.name,
    category: listing.category,
    description: listing.description,
    specs: listing.specs,
    priceAudCents: listing.priceAudCents,
    stockStatus: listing.stockStatus,
    buyUrl: listing.buyUrl,
    offerPostage: listing.offerPostage,
    postageAudCents: listing.postageAudCents,
    localPickup: listing.localPickup,
    postageNote: listing.postageNote,
    paymentTerms: listing.paymentTerms,
    paymentNote: listing.paymentNote,
    highlights: listing.highlights,
    soldByAntidosis: listing.soldByAntidosis,
    stockCount: listing.stockCount,
    seller: {
      businessName: builder.businessName,
      suburb: builder.suburb,
      website: builder.website,
      profile: builder.profile,
    },
  };

  return <ProductDetail product={data} />;
}
