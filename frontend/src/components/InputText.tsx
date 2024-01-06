import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface InputTextProps {
  className?: string;
}

export const InputText = forwardRef<HTMLInputElement, InputTextProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="text"
        className={twMerge(
          `block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm`,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
