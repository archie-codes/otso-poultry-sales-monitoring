"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface FormattedNumberInputProps {
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  className?: string;
  allowDecimals?: boolean;
  required?: boolean;
}

export function FormattedNumberInput({
  name,
  defaultValue = "",
  placeholder,
  className,
  allowDecimals = false,
  required = false,
}: FormattedNumberInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [rawValue, setRawValue] = useState("");

  // Initialize the values if editing an existing record
  useEffect(() => {
    if (
      defaultValue !== undefined &&
      defaultValue !== null &&
      defaultValue !== ""
    ) {
      formatAndSet(String(defaultValue));
    }
  }, [defaultValue]);

  const formatAndSet = (val: string) => {
    // 1. Remove everything except digits and decimal points
    let cleaned = val.replace(allowDecimals ? /[^0-9.]/g : /[^0-9]/g, "");

    // 2. Prevent multiple decimals (e.g., 1.5.5 -> 1.55)
    if (allowDecimals) {
      const parts = cleaned.split(".");
      if (parts.length > 2) {
        cleaned = parts[0] + "." + parts.slice(1).join("");
      }
    }

    // 3. Save the clean number for the database
    setRawValue(cleaned);

    // 4. Add commas for the user's display
    if (cleaned === "") {
      setDisplayValue("");
    } else {
      const parts = cleaned.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      setDisplayValue(parts.join("."));
    }
  };

  return (
    <>
      {/* 1. VISIBLE INPUT: Shows the commas to the user */}
      <Input
        type="text"
        value={displayValue}
        onChange={(e) => formatAndSet(e.target.value)}
        placeholder={placeholder}
        className={className}
        required={required}
      />

      {/* 2. HIDDEN INPUT: Sends the clean number to your Server Action */}
      <input type="hidden" name={name} value={rawValue} />
    </>
  );
}
