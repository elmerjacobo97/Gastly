"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { upsertUserSettings } from "@/features/settings/lib/user-settings-api"
import { type UserSettings } from "@/features/settings/lib/user-settings-api"

export function useUpsertUserSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Partial<UserSettings>) => upsertUserSettings(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-settings"] })
      toast.success("Configuración guardada")
    },
    onError: (error) => {
      toast.error("No se pudo guardar", { description: error.message })
    },
  })
}
