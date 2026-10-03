import { NativeSelectOption } from "@/components/ui/native-select";
import { CURRENCY_CODES, CURRENCY_LABELS } from "@/lib/format";

export function CurrencyOptions() {
  return CURRENCY_CODES.map((code) => (
    <NativeSelectOption key={code} value={code}>
      {CURRENCY_LABELS[code]}
    </NativeSelectOption>
  ));
}
