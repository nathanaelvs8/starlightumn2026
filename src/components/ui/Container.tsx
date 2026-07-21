import type { ReactNode } from "react";
import clsx from "@/lib/clsx";

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto w-full max-w-shell px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}
