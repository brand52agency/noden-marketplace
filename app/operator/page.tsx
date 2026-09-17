import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// The operator pitch now lives on /signup. Old links/bookmarks land here
// and get sent to the right place depending on whether they're signed in.
export default async function OperatorRedirect() {
  const session = await auth();
  redirect(session?.user ? "/operator/dashboard" : "/signup");
}
