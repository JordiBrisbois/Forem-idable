import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EditableTextSectionProps {
  value: string;
  initialValue: string;
  minHeightClassName: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSave: () => Promise<void>;
}

export function EditableTextSection({
  value,
  initialValue,
  minHeightClassName,
  placeholder,
  onChange,
  onSave,
}: EditableTextSectionProps) {
  return (
    <>
      <Textarea
        className={minHeightClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={() => void onSave()}
          disabled={value === initialValue}
        >
          <Save data-icon="inline-start" />
          Enregistrer
        </Button>
      </div>
    </>
  );
}
