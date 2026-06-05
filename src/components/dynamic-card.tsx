"use client"

import { type Ref } from "react"
import { Button } from "@/components/ui/button"
import { GripVertical, Trash2 } from "lucide-react"
import { DynamicField, type DynamicFieldType } from "./dynamic-field"

export interface DynamicFieldConfig {
  name: string
  label: string
  type: DynamicFieldType
  required?: boolean
  placeholder?: string
}

interface DynamicCardProps {
  title: string
  fields: DynamicFieldConfig[]
  values: Record<string, string>
  onChange: (fieldName: string, value: string) => void
  onRemove?: () => void
  canRemove?: boolean
  inputRefs?: Record<string, Ref<HTMLInputElement>>
  richTextMinHeight?: string
}

export function DynamicCard({
  title,
  fields,
  values,
  onChange,
  onRemove,
  canRemove = true,
  inputRefs,
  richTextMinHeight,
}: DynamicCardProps) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
        </div>
        {canRemove && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {fields.map((field) => (
          <DynamicField
            key={field.name}
            type={field.type}
            label={field.label}
            value={values[field.name] ?? ""}
            onChange={(v) => onChange(field.name, v)}
            placeholder={field.placeholder}
            required={field.required}
            inputRef={inputRefs?.[field.name]}
            minHeight={field.type === "richtext" ? richTextMinHeight : undefined}
          />
        ))}
      </div>
    </div>
  )
}
