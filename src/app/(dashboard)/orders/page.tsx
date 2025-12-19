import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";

async function getOrders(officeId: string) {
  return prisma.order.findMany({
    where: { officeId },
    include: {
      menu: { include: { cuisineType: true } },
      rsvps: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.officeId) {
    return <div>No office found</div>;
  }

  const orders = await getOrders(session.user.officeId);

  const statusColors: Record<string, "default" | "success" | "warning" | "info" | "danger"> = {
    DRAFT: "default",
    RSVP_OPEN: "info",
    RSVP_CLOSED: "warning",
    CONFIRMED: "success",
    DELIVERED: "success",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage your catering orders</p>
        </div>
        <Link href="/menus">
          <Button>New Order</Button>
        </Link>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <span className="text-2xl">🍽️</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{order.menu.cuisineType.name}</h3>
                      <p className="text-sm text-gray-600">
                        Week of {format(order.menu.weekOf, "MMMM d, yyyy")}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={statusColors[order.status]}>
                          {order.status.replace("_", " ")}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {order.rsvps.length} RSVPs
                        </span>
                        {order.totalCost && (
                          <span className="text-sm font-medium text-gray-700">
                            ${order.totalCost.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 mb-4">No orders yet</p>
            <Link href="/menus">
              <Button>Browse Menus</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
