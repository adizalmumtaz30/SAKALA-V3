interface ToggleStatusButtonProps {
  id: string;
  status: "active" | "inactive";
  action: (formData: FormData) => Promise<void>;
}

export function ToggleStatusButton({
  id,
  status,
  action,
}: ToggleStatusButtonProps) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="text-[12px] text-ink-muted underline decoration-hairline-strong underline-offset-2 hover:text-ink"
      >
        {status === "active" ? "Nonaktifkan" : "Aktifkan"}
      </button>
    </form>
  );
}
