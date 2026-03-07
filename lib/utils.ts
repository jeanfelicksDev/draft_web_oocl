import { type ClassValue, clsx } from "clsx";

/**
 * Combines class names conditionally.
 */
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}
