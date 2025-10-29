import { forwardRef } from "preact/compat";
import type { JSX } from "preact";
import { cn } from "@/lib/utils";
import "./button.css";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "destructive"
  | "link";

type ButtonSize = "md" | "sm" | "lg" | "icon";

type ButtonNativeProps = JSX.IntrinsicElements["button"];

export interface ButtonProps extends ButtonNativeProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: "btn--primary",
  secondary: "btn--secondary",
  ghost: "btn--ghost",
  outline: "btn--outline",
  destructive: "btn--destructive",
  link: "btn--link",
};

const sizeClassMap: Record<ButtonSize, string> = {
  md: "btn--md",
  sm: "btn--sm",
  lg: "btn--lg",
  icon: "btn--icon",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      className,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn("btn", variantClassMap[variant], sizeClassMap[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
