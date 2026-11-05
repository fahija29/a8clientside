import { Suspense } from "react";
import BookDetails from "./details";

export default function BookDetailsRoute({
  params,
}: {
  params: Promise<{ title: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <DetailsSection params={params} />
    </Suspense>
  );
}

async function DetailsSection({
  params,
}: {
  params: Promise<{ title: string }>;
}) {
  const { title } = await params;

  return <BookDetails title={title} />;
}
