import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface InputCheckboxProps {
  className?: string;
}

export const InputCheckbox = forwardRef<HTMLInputElement, InputCheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={twMerge(
          `h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500`,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
