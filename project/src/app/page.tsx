import Image from "next/image";
import Link from "next/link"
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
      
        <div className={styles.intro}>
          <p>Welcome to</p>
          <h1>Stack Underflow</h1>
          <h2>The new place for all things programming</h2>
          <p>
            To get started: {" "}
            <Link href="/createaccount">Create an account</Link>
          </p>
          <p>
            Been here before? {" "}
            <Link href="/login">Login</Link>
          </p>
          <p>
            Jump right in: {" "}
            <Link href="/channels">Browse Channels</Link>
          </p>
        </div>

        {/* TODO fix this later lol
        <Image
          className={styles.logo}
          src="/people_cropped_inverted.png"
          alt="Created with Next.js"
          width={100}
          height={20}
          style="mix-blend-mode: screen"
          priority
        /> */}
        
      </main>
    </div>
  );
}
