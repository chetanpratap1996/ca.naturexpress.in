import { redirect } from "next/navigation";

/** Keep old bookmarks working while the unified workspace lives at /. */
export default function AdminRedirect() {
  redirect("/");
}
