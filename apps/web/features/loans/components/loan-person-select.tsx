"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NEW_PERSON_VALUE = "__new__";

type LoanPersonSelectProps = {
  personNames: string[];
  value: string;
  onChange: (value: string) => void;
  "aria-invalid"?: boolean;
  id?: string;
};

export function LoanPersonSelect({
  personNames,
  value,
  onChange,
  "aria-invalid": ariaInvalid,
  id,
}: LoanPersonSelectProps) {
  const [creating, setCreating] = useState(personNames.length === 0);

  if (creating) {
    return (
      <div className="flex gap-2">
        <Input
          aria-invalid={ariaInvalid}
          autoFocus
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ej: Juan García"
          value={value}
        />
        {personNames.length > 0 && (
          <Button
            aria-label="Elegir persona existente"
            onClick={() => {
              setCreating(false);
              onChange("");
            }}
            size="icon"
            type="button"
            variant="outline"
          >
            <XIcon className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Select
        onValueChange={(next) => {
          if (next === NEW_PERSON_VALUE) {
            setCreating(true);
            onChange("");
            return;
          }
          onChange(next);
        }}
        value={value || undefined}
      >
        <SelectTrigger aria-invalid={ariaInvalid} className="flex-1" id={id}>
          <SelectValue placeholder="Selecciona una persona" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {personNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button
        aria-label="Nueva persona"
        onClick={() => setCreating(true)}
        size="icon"
        type="button"
        variant="outline"
      >
        <PlusIcon className="size-4" />
      </Button>
    </div>
  );
}
