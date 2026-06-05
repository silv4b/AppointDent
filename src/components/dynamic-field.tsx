"use client"

import { type Ref } from "react"
import { cn } from "@/lib/utils"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { RichTextEditor } from "./rich-text-editor"

export type DynamicFieldType = "text" | "richtext"

interface DynamicFieldProps {
  label?: string
  type: DynamicFieldType
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  inputRef?: Ref<HTMLInputElement>
  inputClassName?: string
  minHeight?: string
  maxLength?: number
  inputType?: string
}

export function DynamicField({
  label,
  type,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  className,
  inputRef,
  inputClassName,
  minHeight,
  maxLength,
  inputType,
}: DynamicFieldProps) {
  return (
    <div className={className}>
      {label && (
        <Label className="text-xs">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      {type === "richtext" ? (
        <RichTextEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minHeight={minHeight}
          className={cn("mt-1", inputClassName)}
        />
      ) : (
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("mt-1", inputClassName)}
          maxLength={maxLength}
          type={inputType}
        />
      )}
    </div>
  )
}
