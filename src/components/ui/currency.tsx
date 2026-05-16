import { cn } from "@/lib/utils";

interface CurrencyProps {
  amount: number;
  className?: string;
}

export function Currency({ amount, className }: CurrencyProps) {
  const formatted = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);

  return <span className={cn("font-medium", className)}>{formatted}</span>;
}