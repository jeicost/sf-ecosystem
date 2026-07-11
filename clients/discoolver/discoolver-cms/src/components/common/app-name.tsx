import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface Props {
  link?: string;
  isExtended?: boolean;
  className?: string;
  height?: number;
  width?: number;
}

export function AppName({
  link,
  isExtended,
  className,
  height = 30,
  width = 30,
}: Props) {
  const component = (
    <div
      className={cn(
        "flex items-center gap-4",
        isExtended ? "px-2" : "",
        className
      )}
    >
      <Image
        alt="Discoolver"
        src="/logo.svg"
        height={height}
        width={width}
        sizes="30px"
        style={{ minHeight: height, minWidth: width }}
      />
      {isExtended && <span className="text-lg font-medium">Discoolver</span>}
    </div>
  );

  return link ? <Link href={link}>{component}</Link> : component;
}
