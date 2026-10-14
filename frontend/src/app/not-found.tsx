import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="flex-1 min-h-[100dvh] flex items-center justify-center bg-cream px-5 py-16">
      <div className="max-w-md text-center">
        <Image src="/logo.png" alt="" width={942} height={957} className="h-16 w-auto mx-auto mb-6" />
        <p className="eyebrow mb-3">Error 404</p>
        <h1 className="font-display font-medium text-[40px] md:text-[52px] leading-tight text-ink">
          This page has wandered off
        </h1>
        <p className="font-sans text-[15px] text-muted mt-3">
          The link may be old, or the gift may have been retired. Let&apos;s find you something lovely.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link href="/" className="btn-primary px-8">Back to home</Link>
          <Link href="/category/all" className="btn-ghost px-8">Browse gifts</Link>
        </div>
      </div>
    </main>
  );
}
