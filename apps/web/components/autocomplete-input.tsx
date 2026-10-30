"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { type ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { matchesQuery } from "@/lib/search";

type AutocompleteInputProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange"
> & {
  value: string;
  onValueChange: (value: string) => void;
  suggestions: string[];
};

/** Free-text input that suggests existing values; typing a new one is fine. */
export function AutocompleteInput({
  value,
  onValueChange,
  suggestions,
  ...props
}: AutocompleteInputProps) {
  const matches = suggestions.filter(
    (name) => matchesQuery(value, name) && name !== value,
  );

  return (
    <Autocomplete.Root
      items={matches}
      value={value}
      onValueChange={onValueChange}
      filter={null}
    >
      <Autocomplete.Input render={<Input {...props} autoComplete="off" />} />
      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={4} className="isolate z-50">
          <Autocomplete.Popup className="w-(--anchor-width) rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden">
            <Autocomplete.List>
              {(name: string) => (
                <Autocomplete.Item
                  key={name}
                  value={name}
                  className="cursor-default rounded-md px-2 py-1.5 text-sm data-highlighted:bg-muted"
                >
                  {name}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
