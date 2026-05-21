"use client"

import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost">
          <SunIcon className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
          <MoonIcon className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <SunIcon />
            Claro
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <MoonIcon />
            Oscuro
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <LaptopIcon />
            Sistema
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
