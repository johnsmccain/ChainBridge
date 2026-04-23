import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found | ChainBridge",
  description: "The page you were looking for does not exist. Return to ChainBridge.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 text-center"
      aria-labelledby="notfound-heading"
    >
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-overlay border border-border text-text-muted"
        aria-hidden="true"
      >
        <Compass className="h-10 w-10" />
      </div>

      <h1
        id="notfound-heading"
        className="text-4xl font-extrabold tracking-tight text-text-primary"
      >
        404 — Destination Unknown
      </h1>

      <p className="mt-4 max-w-md text-text-secondary">
        The page you are looking for has either sailed past the timelock or never existed in this
        chain.
      </p>

      <nav
        className="mt-10 flex flex-wrap items-center justify-center gap-3"
        aria-label="Recovery navigation"
      >
        <Link href="/">
          <Button size="lg" className="rounded-xl px-8">
            <Home className="mr-2 h-5 w-5" aria-hidden="true" />
            Return to Bridge
          </Button>
        </Link>
        <Link href="/swap">
          <Button variant="outline" size="lg" className="rounded-xl px-8">
            Go to Swap
            <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
          </Button>
        </Link>
      </nav>
    </main>
  );
}
