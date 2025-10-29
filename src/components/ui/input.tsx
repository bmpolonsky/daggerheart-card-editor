import { forwardRef } from "preact/compat";
import type { JSX } from "preact";
import { cn } from "@/lib/utils";
import "./input.css";

type InputProps = JSX.IntrinsicElements["input"];

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input ref={ref} type={type} className={cn("input", className)} {...props} />
  )
);

Input.displayName = "Input";
