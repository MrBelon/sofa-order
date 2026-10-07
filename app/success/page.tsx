import { OrderSuccess } from "@/components/OrderSuccess";
import { UserShell } from "@/components/UserShell";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ drink?: string | string[] }>;
}) {
  const { drink } = await searchParams;
  const name = (Array.isArray(drink) ? drink[0] : drink) ?? "";

  return (
    <UserShell>
      <OrderSuccess drink={name.slice(0, 100)} />
    </UserShell>
  );
}
