import styles from "./Spinner.module.css";
// simple loading spinner
export default function Spinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} />
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}