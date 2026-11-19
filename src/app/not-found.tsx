import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "404", alternates: { canonical: null } };

export default function NotFound() {
  return (
    <main className="page">
      <h1 className="banner">404</h1>
      <p className="line">parker@ptl:~$ cd ???</p>
      <p className="out error">no such file or directory</p>
      <p className="out">
        <Link href="/">cd ~</Link>
      </p>
    </main>
  );
}
