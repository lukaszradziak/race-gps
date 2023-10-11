import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

type ButtonVariant = "solid" | "white";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const getVariant = (variant: ButtonVariant) => {
  switch (variant) {
    case "solid":
      return "";
    case "white":
      return "bg-white text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-none";
    default:
      return undefined;
  }
};

const getSize = (size: ButtonSize) => {
  switch (size) {
    case "sm":
      return "px-2.5 py-1.5";
    case "md":
      return "px-3 py-2 rounded-md";
    case "lg":
      return "px-4 py-3 rounded-md text-md";
    case "xl":
      return "px-6 py-4 rounded-md text-md";
    default:
      return undefined;
  }
};

export function Button({
  variant = "solid",
  type = "button",
  size = "md",
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"button"> & ButtonOptions) {
  return (
    <button
      type={type}
      {...props}
      className={twMerge(
        `inline-flex items-center rounded border border-transparent bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 justify-center`,
        getVariant(variant),
        getSize(size),
        className,
      )}
    >
      {children}
    </button>
  );
}
