type AccountLabelProps = {
  account: { name: string; color: string } | null | undefined;
};

export function AccountLabel({ account }: AccountLabelProps) {
  if (!account) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: account.color }}
      />
      {account.name}
    </div>
  );
}
