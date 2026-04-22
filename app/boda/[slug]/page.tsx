import BodaClient from "./BodaClient";

export default function BodaPage({ params }: { params: { slug: string } }) {
  return <BodaClient slug={params.slug} />;
}