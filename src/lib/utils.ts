// Merges Tailwind class lists, resolving conflicts (e.g. a later "p-4"
// overriding an earlier "p-2") instead of leaving both in the output.
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
