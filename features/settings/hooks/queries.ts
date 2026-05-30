"use client"

import { useQuery } from "@tanstack/react-query"
import { getUserSettings } from "@/features/settings/lib/user-settings-api"
import { getTelegramConnection } from "@/features/settings/lib/settings-api"

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
