import { notFound } from "next/navigation";
import { AuthPageView } from "./auth-view";

const supportedPaths = new Set(["sign-in", "sign-up", "forgot-password", "reset-password"]);

export default async function AuthRoute({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  if (!supportedPaths.has(path)) notFound();
  return <AuthPageView path={path} />;
}
