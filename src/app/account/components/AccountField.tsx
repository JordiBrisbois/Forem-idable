import { ComponentProps } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type AccountFieldProps = {
  label: string;
  error?: string;
  description?: string;
} & ComponentProps<"input">;

export function AccountField({
  label,
  error,
  description,
  id,
  ...inputProps
}: AccountFieldProps) {
  const descriptionId = id && description ? `${id}-description` : undefined;
  const errorId = id && error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <Field data-invalid={error ? "true" : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        {...inputProps}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={describedBy}
      />
      <div className="min-h-5">
        {description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
        {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      </div>
    </Field>
  );
}
