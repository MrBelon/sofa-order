import { OrderHistory } from "@/components/OrderHistory";
import { UserShell } from "@/components/UserShell";

export default function OrdersPage() {
  return (
    <UserShell>
      <h1 className="mb-5 text-2xl font-extrabold">Mes commandes</h1>
      <OrderHistory />
    </UserShell>
  );
}
