import type { ModalNotification } from "@/utils/types";

export default function ModalNotification(props: ModalNotification) {
  const { message, type } = props;

  const styles: Record<ModalNotification["type"], string> = {
    error: "bg-error/10 border-error/20 text-error",
    success: "bg-success/10 border-success/20 text-success",
    warning: "bg-warning/10 border-warning/20 text-warning",
    info: "bg-info/10 border-info/20 text-info",
  };

  return (
    <p
      className={`block w-full p-4 rounded-lg text-sm border-2 ${styles[type]} break-words whitespace-pre-line max-h-32 overflow-y-auto`}
      style={{ wordBreak: "break-word" }}
    >
      {message}
    </p>
  );
}
