import { ComponentPropsWithoutRef } from "react";

export function Button(props: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      type="button"
      className="mb-2 justify-center inline-flex items-center rounded-md border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
    >
      {props.children}
    </button>
  );
}
