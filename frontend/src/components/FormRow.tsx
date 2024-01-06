import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";
import { Label } from "./Label.tsx";

interface FormRowOptions {
  label?: string;
}

export function FormRow({
  label,
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div"> & FormRowOptions) {
  return (
    <div
      className={twMerge(`space-y-6 sm:space-y-5 pt-3`, className)}
      {...props}
    >
      <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-gray-200 sm:pt-5">
        {label ? <Label>{label}</Label> : null}
        <div className="mt-1 sm:col-span-2 sm:mt-0">{children}</div>
      </div>
    </div>
  );
}
