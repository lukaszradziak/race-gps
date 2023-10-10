import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

interface CardOptions {
  title?: string;
}

export function Card({
  title,
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div"> & CardOptions) {
  return (
    <div
      className={twMerge(
        `overflow-hidden bg-white rounded-lg shadow mb-2`,
        className,
      )}
      {...props}
    >
      {title ? (
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {title}
          </h3>
        </div>
      ) : null}
      <div className="px-4 py-4 sm:px-6">{children}</div>
    </div>
  );
}
