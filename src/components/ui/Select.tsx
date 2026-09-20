"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}

/**
 * Primitive `ui/` (UI_WORKFLOW.md + audit shadcn/Base UI) — tidak tahu apa
 * pun soal domain SAKALA, cuma menerima value/label generik. Menggantikan
 * `<select>` native satu per satu (bukan big-bang) supaya styling, focus
 * ring, dan keyboard nav konsisten dengan primitive Radix lain yang sudah
 * dipakai (Dialog/Popover/Tooltip) — bukan campuran native + Radix.
 */
export function Select({ name, value, onValueChange, options, className }: SelectProps) {
  return (
    <RadixSelect.Root name={name} value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger
        className={
          className ??
          "flex items-center gap-1.5 rounded-lg border border-hairline-strong bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-accent-teal"
        }
      >
        <RadixSelect.Value />
        <RadixSelect.Icon>
          <ChevronDown size={13} strokeWidth={1.75} className="text-ink-faint" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-50 overflow-hidden rounded-lg border border-hairline-strong bg-surface-overlay/95 shadow-2xl backdrop-blur-md [animation:drawer-fade-in_120ms_ease-out]"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((o) => (
              <RadixSelect.Item
                key={o.value}
                value={o.value}
                className="flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-[12.5px] text-ink-muted outline-none data-[highlighted]:bg-surface-focus data-[highlighted]:text-ink data-[state=checked]:text-ink"
              >
                <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <Check size={13} strokeWidth={1.75} className="text-accent-teal" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
