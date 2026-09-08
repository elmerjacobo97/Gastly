"use client"

import { useQuery } from "@tanstack/react-query"
import { getUserSettings } from "@/lib/finance/settings/lib/user-settings-api"
import { getTelegramConnection } from "@/lib/finance/settings/lib/settings-api"

export function useUserSettings() {
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: getUserSettings,
  })
}

export function useTelegramConnection() {
  return useQuery({
    queryKey: ["telegram-connection"],
    queryFn: getTelegramConnection,
  })
}
