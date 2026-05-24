import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";

import NeedDetailClient from "./_components/need-detail-client";

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const need = await prisma.need.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      needCategory: true,
      offerType: true,
      offerDescription: true,
      isLocal: true,
      locationName: true,
      poster: {
        select: {
          fullName: true,
          locationName: true,
        },
      },
    },
  });

  if (!need) {
    return {
      title: "Need Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = need.title;
  const category = need.needCategory ?? "General";
  const location = need.isLocal ? (need.locationName ?? "Central Coast, NSW") : "Online / Remote";
  const posterName = need.poster?.fullName ?? "Someone";

  const description =
    need.description.length > 160 ? need.description.slice(0, 157) + "..." : need.description;

  const siteUrl = "https://antidosis.com";

  return {
    title,
    description: `${description} — Posted by ${posterName} in ${location}. ${category} · ${need.offerType} exchange on antidosis.`,
    openGraph: {
      type: "article",
      locale: "en_AU",
      url: `${siteUrl}/needs/${need.id}`,
      siteName: "antidosis",
      title: `${title} — antidosis`,
      description,
      images: [
        {
          url: `/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — antidosis`,
      description,
      images: [`/opengraph-image`],
    },
    alternates: {
      canonical: `${siteUrl}/needs/${need.id}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function NeedDetailPage({ params }: Props) {
  const needExists = await prisma.need.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!needExists) {
    notFound();
  }

  return <NeedDetailClient needId={params.id} />;
}
