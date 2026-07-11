import { AppName } from "@/components/common/app-name";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="w-full min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10 hide-scrollbar">
          <div className="flex justify-center gap-2 md:justify-start">
            <Link href="/" className="flex items-center gap-2 font-medium">
              <AppName className="text-foreground" isExtended />
            </Link>
          </div>
          <div className="flex items-center justify-center flex-1">
            <div className="w-full max-w-xs">{children}</div>
          </div>
        </div>
        <div className="relative hidden bg-muted lg:block lg:fixed lg:right-0 lg:top-0 lg:h-screen lg:w-1/2">
          <Image
            src="/images/background.webp"
            alt="Image"
            fill
            className="object-cover dark:brightness-[0.4] dark:grayscale"
            priority
          />
        </div>
      </div>
    </main>
  );
}
