import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import "./input.css";

export const Input = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn("input", className)}
      {...props}
    />
  )
);

Input.displayName = "Input";
