import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  message: string;
  subMessage?: string;   // optional extra detail e.g. "This cannot be undone"
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  message,
  subMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.dialog}>
        <p className={styles.message}>{message}</p>
        {subMessage && (
          <p className={styles.subMessage}>{subMessage}</p>
        )}
        <div className={styles.actions}>
          <button className={styles.confirmButton} onClick={onConfirm}>
            Confirm
          </button>
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}