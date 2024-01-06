import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface InputNumberProps {
  step?: string;
  className?: string;
}

export const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="number"
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
