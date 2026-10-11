"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { type Resolver, Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { CurrencyField } from "@/components/currency-field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { NumberInput } from "@/components/ui/number-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  createWishlistItem,
  updateWishlistItem,
} from "@/features/wishlist/server/actions";
import {
  wishlistItemSchema,
  type WishlistItemValues,
} from "@/features/wishlist/schemas/wishlist-schemas";
import { PRIORITY_LABELS } from "@/features/wishlist/lib/wishlist-labels";
import {
  WISHLIST_PRIORITIES,
  type WishlistItem,
} from "@/features/wishlist/types/wishlist-types";

type WishlistItemDialogProps = {
  item?: WishlistItem;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function buildDefaultValues(item?: WishlistItem): WishlistItemValues {
  return {
    name: item?.name ?? "",
    estimatedPrice: item?.estimatedPrice ?? 0,
    currency: item?.currency ?? "PEN",
    url: item?.url ?? "",
    priority: item?.priority ?? "medium",
    notes: item?.notes ?? "",
  };
}

export function WishlistItemDialog({
  item,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: WishlistItemDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isControlled = controlledOpen !== undefined;
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const isEditing = item !== undefined;

  const form = useForm<WishlistItemValues>({
    resolver: zodResolver(wishlistItemSchema) as Resolver<WishlistItemValues>,
    defaultValues: buildDefaultValues(item),
  });

  function onSubmit(values: WishlistItemValues) {
    startTransition(async () => {
      try {
        if (item) {
          await updateWishlistItem(item.id, values);
        } else {
          await createWishlistItem(values);
        }
        toast.success(isEditing ? "Producto actualizado" : "Producto agregado");
        form.reset();
        setOpen(false);
      } catch (error) {
        toast.error(
          isEditing
            ? "No se pudo actualizar el producto"
            : "No se pudo agregar el producto",
          {
            description:
              error instanceof Error ? error.message : "Inténtalo de nuevo.",
          },
        );
      }
    });
  }

  const defaultTrigger = (
    <Button>
      <PlusIcon data-icon="inline-start" />
      <span className="hidden sm:inline">Nuevo producto</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      )}
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </DialogTitle>
          <DialogDescription>
            Guarda algo que quieres comprar en el futuro.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-4 min-h-0">
          <div className="px-4 pb-1">
            <form
              id="wishlist-item-form"
              className="flex flex-col gap-5"
              noValidate
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FieldGroup>
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="wi-name">Producto</FieldLabel>
                      <Input
                        {...field}
                        id="wi-name"
                        aria-invalid={fieldState.invalid}
                        placeholder="Ej. Edredón 1.5 plazas, Gorra"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="currency"
                  render={({ field, fieldState }) => (
                    <CurrencyField
                      id="wi-currency"
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="estimatedPrice"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="wi-price">
                        Precio estimado
                      </FieldLabel>
                      <NumberInput
                        {...field}
                        id="wi-price"
                        aria-invalid={fieldState.invalid}
                        inputMode="decimal"
                        min="0"
                        placeholder="0.00"
                        step="0.01"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="wi-priority">Prioridad</FieldLabel>
                      <NativeSelect
                        {...field}
                        id="wi-priority"
                        className="w-full"
                      >
                        {WISHLIST_PRIORITIES.map((priority) => (
                          <NativeSelectOption key={priority} value={priority}>
                            {PRIORITY_LABELS[priority]}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="url"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="wi-url">
                        Link{" "}
                        <span className="text-muted-foreground">
                          (opcional)
                        </span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id="wi-url"
                        aria-invalid={fieldState.invalid}
                        inputMode="url"
                        placeholder="https://"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="wi-notes">
                        Notas{" "}
                        <span className="text-muted-foreground">
                          (opcional)
                        </span>
                      </FieldLabel>
                      <Textarea
                        {...field}
                        id="wi-notes"
                        placeholder="Talla, color, dónde lo viste"
                        rows={2}
                      />
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button disabled={isPending} form="wishlist-item-form" type="submit">
            {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            {isEditing ? "Guardar" : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
