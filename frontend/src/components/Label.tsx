import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

export function Label({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={twMerge(
        `block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2`,
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}
