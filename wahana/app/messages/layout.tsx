import { requireUser } from "@/lib/auth";
import { getConversations } from "@/lib/conversations";
import { InboxShell } from "./inbox";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/messages");
  const conversations = await getConversations(user.id);
  return <InboxShell conversations={conversations}>{children}</InboxShell>;
}
