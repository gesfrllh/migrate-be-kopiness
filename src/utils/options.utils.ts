import { SelectOptions } from "src/common/types";

export function enumToOptions<T extends Record<string, string>>(
  enumObj: T,
  labelMap?: Partial<Record<keyof T, string>>
): SelectOptions[] {
  return Object.values(enumObj).map((value) => ({
    value,
    label:
      labelMap?.[value as keyof T] ??
      value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }))
}