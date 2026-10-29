import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
        secondary: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        danger: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
        demo: "bg-gradient-to-r from-rose-500 to-orange-500 text-white",
        verified: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
