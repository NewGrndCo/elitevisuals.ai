export const metadata = { title: "Prompt Library", alternates: { canonical: "/library" } };
import { redirect } from "next/navigation";
export default function Library() {
  redirect("/promptbox");
}
