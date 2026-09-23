"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { parseOrThrow } from "@/lib/validation";
import {
  custodyMovementIdSchema,
  custodyMovementSchema,
  custodyOrderIdSchema,
  custodyOrderSchema,
  custodyOrderStatusSchema,
  type CustodyMovementValues,
  type CustodyOrderValues,
} from "@/features/custody/schemas/custody-schemas";
import { type CustodyOrderStatus } from "@/features/custody/types/custody-types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Debes iniciar sesión.");

  return { supabase, userId: user.id };
}

function revalidateCustody() {
  revalidatePath("/custody");
  revalidatePath("/");
}

export async function createCustodyOrder(
  rawValues: CustodyOrderValues,
): Promise<void> {
  const values = parseOrThrow(custodyOrderSchema, rawValues);
  const { supabase, userId } = await requireUser();

  const { error } = await supabase.from("custody_orders").insert({
    user_id: userId,
    person_name: values.personName,
    title: values.title,
    target_amount:
      values.targetAmount && values.targetAmount > 0
        ? values.targetAmount
        : null,
    expected_on: values.expectedOn || null,
    notes: values.notes || null,
  });

  if (error) throw new Error(error.message);
  revalidateCustody();
}

export async function updateCustodyOrder(
  rawId: string,
  rawValues: CustodyOrderValues,
): Promise<void> {
  const id = parseOrThrow(custodyOrderIdSchema, rawId);
  const values = parseOrThrow(custodyOrderSchema, rawValues);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("custody_orders")
    .update({
      person_name: values.personName,
      title: values.title,
      target_amount:
        values.targetAmount && values.targetAmount > 0
          ? values.targetAmount
          : null,
      expected_on: values.expectedOn || null,
      notes: values.notes || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateCustody();
}

export async function updateCustodyOrderStatus(
  rawId: string,
  rawStatus: CustodyOrderStatus,
): Promise<void> {
  const id = parseOrThrow(custodyOrderIdSchema, rawId);
  const status = parseOrThrow(custodyOrderStatusSchema, rawStatus);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("custody_orders")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateCustody();
}

export async function deleteCustodyOrder(rawId: string): Promise<void> {
  const id = parseOrThrow(custodyOrderIdSchema, rawId);
  const { supabase } = await requireUser();

  const { error } = await supabase.from("custody_orders").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateCustody();
}

export async function recordCustodyMovement(
  rawCustodyOrderId: string,
  rawValues: CustodyMovementValues,
): Promise<void> {
  const custodyOrderId = parseOrThrow(custodyOrderIdSchema, rawCustodyOrderId);
  const values = parseOrThrow(custodyMovementSchema, rawValues);
  const { supabase } = await requireUser();

  const { error } = await supabase.from("custody_movements").insert({
    custody_order_id: custodyOrderId,
    type: values.type,
    amount: values.amount,
    occurred_on: values.occurredOn,
    method: values.type === "deposit" ? values.method || null : null,
    notes: values.notes || null,
  });

  if (error) throw new Error(error.message);
  revalidateCustody();
}

export async function updateCustodyMovement(
  rawId: string,
  rawValues: CustodyMovementValues,
): Promise<void> {
  const id = parseOrThrow(custodyMovementIdSchema, rawId);
  const values = parseOrThrow(custodyMovementSchema, rawValues);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("custody_movements")
    .update({
      type: values.type,
      amount: values.amount,
      occurred_on: values.occurredOn,
      method: values.type === "deposit" ? values.method || null : null,
      notes: values.notes || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateCustody();
}

export async function deleteCustodyMovement(rawId: string): Promise<void> {
  const id = parseOrThrow(custodyMovementIdSchema, rawId);
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("custody_movements")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateCustody();
}
