import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default function MessagesIndex() {
  return (
    <div className="hidden h-full flex-col items-center justify-center p-10 text-center lg:flex">
      <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-soft-fg">
        <MessageCircle className="size-7" />
      </span>
      <p className="mt-4 text-lg font-bold">Pick a conversation</p>
      <p className="mt-1 max-w-xs text-[15px] text-fg-muted">Chats with buyers and sellers show up here. Your number stays private until you share it.</p>
    </div>
  );
}
