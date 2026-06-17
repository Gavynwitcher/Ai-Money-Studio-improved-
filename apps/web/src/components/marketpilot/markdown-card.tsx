export function MarkdownCard({ content }: { content: string }) {
  return (
    <div className="whitespace-pre-wrap rounded-2xl border border-[#dfe7dd] bg-white p-5 text-sm leading-7 text-[#233129] shadow-sm">
      {content}
    </div>
  );
}
