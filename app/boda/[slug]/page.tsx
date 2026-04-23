"use client";
import { use } from "react";
import BodaClient from "./BodaClient";

export default function BodaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <BodaClient slug={slug} />;
}