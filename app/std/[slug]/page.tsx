"use client";
import { use } from "react";
import StdClient from "./StdClient";

export default function StdPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <StdClient slug={slug} />;
}
