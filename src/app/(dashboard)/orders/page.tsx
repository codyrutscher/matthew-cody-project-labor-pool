import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";

interface Order {
  id: string;
  status: string;
  totalCost: number | null;
  createdAt: string;
  Menu: {
    weekOf: string;
    CuisineType: { name: string };
  };
  RSVP: { id: string }[];
  OrderItem: { id: string }[];
}

async function getOrders(officeId: string) {
  const { data: orders, error } = await supabase
    
    .from("Order")
    .select(`
      *,
      Menu:menuId (weekOf, CuisineType:cuisineTypeId (name)),
      RSVP (*),
      OrderItem (*)
    `)
    .eq("officeId", officeId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Get orders error:", error);
    return [];
  }

  return orders as Order[];
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
                      <h3 className="font-semibold">{order.Menu?.CuisineType?.name}</h3>
                      <p className="text-sm text-gray-600">
                        Week of {format(new Date(order.Menu?.weekOf), "MMMM d, yyyy")}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={statusColors[order.status]}>
                          {order.status.replace("_", " ")}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {order.RSVP?.length || 0} RSVPs
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
