import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

type TableSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function TableSearchInput({
  value,
  onChange,
  placeholder = "Buscar",
}: TableSearchInputProps) {
  return (
    <div className="relative w-full sm:w-64">
      <SearchIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-8 pl-8 text-sm"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
