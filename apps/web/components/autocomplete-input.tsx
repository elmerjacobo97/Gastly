"use client";

import { type ComponentProps, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { matchesQuery } from "@/lib/search";
import { cn } from "@/lib/utils";

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
  onFocus,
  onKeyDown,
  ...props
}: AutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const matches = suggestions.filter(
    (name) => matchesQuery(value, name) && name !== value,
  );
  const isOpen = open && matches.length > 0;

  function choose(name: string) {
    onValueChange(name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.key === "Escape" && isOpen) {
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        const next = current + step;
        if (next < 0) return matches.length - 1;
        return next >= matches.length ? 0 : next;
      });
    } else if (event.key === "Enter" && isOpen && matches[activeIndex]) {
      event.preventDefault();
      choose(matches[activeIndex]);
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          {...props}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          autoComplete="off"
          onChange={(event) => {
            onValueChange(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={(event) => {
            onFocus?.(event);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          role="combobox"
          value={value}
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) gap-0 p-1"
        onInteractOutside={(event) => {
          if (event.target === inputRef.current) event.preventDefault();
        }}
        onOpenAutoFocus={(event) => event.preventDefault()}
        sideOffset={4}
      >
        <ul role="listbox">
          {matches.map((name, index) => (
            <li key={name} role="option" aria-selected={index === activeIndex}>
              <button
                className={cn(
                  "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                  index === activeIndex && "bg-muted",
                )}
                onClick={() => choose(name)}
                onMouseDown={(event) => event.preventDefault()}
                type="button"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
