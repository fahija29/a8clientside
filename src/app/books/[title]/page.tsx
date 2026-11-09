import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
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

  // Book Details is a private route — signed-out visitors are sent to
  // /login (the server proxy in src/proxy.ts already bounces them before
  // this renders; RequireAuth is the client-side second layer).
  return (
    <RequireAuth>
      <BookDetails title={title} />
    </RequireAuth>
  );
}
