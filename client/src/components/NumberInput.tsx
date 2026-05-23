import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * NumberInput
 *
 * Drop-in replacement for shadcn `<Input>` for numeric money/valuation fields.
 *
 * - Displays the value with thousand-separators as the user types
 *   (e.g. typing "1000000" shows "1,000,000").
 * - Supports decimal points (e.g. "0.70" or "1,234.56").
 * - The `value` prop is the raw numeric value (number or "" when empty).
 * - The `onChange` callback receives the raw numeric value via a synthetic
 *   event whose `.target.value` is a plain number string (no commas) — so
 *   parents that do `Number(e.target.value)` continue to work unchanged.
 * - `inputMode="decimal"` so mobile keyboards show the numeric pad.
 * - Identical styling to shadcn `<Input>`.
 *
 * Negative numbers aren't actively rejected here — zod validation in the
 * parent form is the source of truth.
 */

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value: number | string;
  onChange?: (e: { target: { value: string } }) => void;
  /** Max number of fraction digits to display while typing (default 6). */
  maxFractionDigits?: number;
}

function formatWithCommas(raw: string, maxFractionDigits: number): string {
  if (raw === "" || raw === "-") return raw;

  // Allow only digits, one decimal point, and an optional leading minus.
  // Strip any other characters defensively.
  let cleaned = raw.replace(/[^\d.\-]/g, "");
  // Keep only the first leading minus.
  cleaned = cleaned.replace(/(?!^)-/g, "");
  // Keep only the first decimal point.
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "");
  }

  const negative = cleaned.startsWith("-");
  const unsigned = negative ? cleaned.slice(1) : cleaned;

  const dotIdx = unsigned.indexOf(".");
  let intPart = dotIdx === -1 ? unsigned : unsigned.slice(0, dotIdx);
  let fracPart = dotIdx === -1 ? "" : unsigned.slice(dotIdx + 1);

  // Strip leading zeros from int part, but keep a single "0".
  if (intPart.length > 1) intPart = intPart.replace(/^0+/, "") || "0";

  // Trim fraction to maxFractionDigits.
  if (fracPart.length > maxFractionDigits) {
    fracPart = fracPart.slice(0, maxFractionDigits);
  }

  // Insert thousand separators into the integer part.
  let withCommas = "";
  if (intPart.length > 0) {
    withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  let out = withCommas;
  if (dotIdx !== -1) {
    out = out + "." + fracPart;
  }
  if (negative) out = "-" + out;
  return out;
}

function stripCommas(s: string): string {
  return s.replace(/,/g, "");
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, maxFractionDigits = 6, ...props }, ref) => {
    // Convert the incoming raw value to its formatted display string.
    const rawDisplay = React.useMemo(() => {
      if (value === "" || value === null || value === undefined) return "";
      if (typeof value === "number") {
        if (!isFinite(value)) return "";
        // Use plain toString — avoid scientific notation for normal magnitudes.
        return formatWithCommas(String(value), maxFractionDigits);
      }
      // It's already a string — could already contain commas if parent kept
      // them; safe to re-format from the raw form.
      return formatWithCommas(stripCommas(value), maxFractionDigits);
    }, [value, maxFractionDigits]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = stripCommas(e.target.value);
      // Emit a synthetic event-like object whose target.value is the raw
      // numeric string — parents that do `Number(e.target.value)` keep working.
      onChange?.({ target: { value: raw } });
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={rawDisplay}
        onChange={handleChange}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      />
    );
  },
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
