import { App } from "@/components/App";
import { StaticContent } from "@/components/StaticContent";

export default function Home() {
  return (
    <>
      <StaticContent />
      <App initialCommand="help" />
    </>
  );
}
