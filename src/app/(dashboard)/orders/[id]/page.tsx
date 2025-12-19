import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import { OrderActions } from "./order-actions";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface RSVP {
  id: string;
  submittedAt: string;
  User: { id: string; name: string | null; email: string };
}

interface Order {
  id: string;
  status: string;
  totalCost: number | null;
  rsvpToken: string;
  rsvpDeadline: string | null;
  Menu: {
    weekOf: string;
    CuisineType: { name: string };
    CulturalCelebration: { name: string; description: string | null } | null;
  };
  OrderItem: OrderItem[];
  RSVP: RSVP[];
}

async function getOrder(id: string, officeId: string) {
  const { data: order, error } = await supabase
    
    .from("Order")
    .select(`
      *,
      Menu:menuId (
        weekOf,
        CuisineType:cuisineTypeId (name),
        CulturalCelebration:culturalCelebrationId (name, description)
      ),
      OrderItem (*),
      RSVP (*, User:userId (id, name, email))
    `)
    .eq("id", id)
    .eq("officeId", officeId)
    .single();

  if (error) {
    console.error("Get order error:", error);
    return null;
  }

  return order as Order;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.officeId) {
    return <div>Unauthorized</div>;
  }

  const order = await getOrder(id, session.user.officeId);

  if (!order) {
    notFound();
  }

  const statusColors: Record<string, "default" | "success" | "warning" | "info"> = {
    DRAFT: "default",
    RSVP_OPEN: "info",
    RSVP_CLOSED: "warning",
    CONFIRMED: "success",
    DELIVERED: "success",
  };

  const rsvpUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/rsvp/${order.rsvpToken}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.Menu?.CuisineType?.name}</h1>
          <p className="text-gray-600">Week of {format(new Date(order.Menu?.weekOf), "MMMM d, yyyy")}</p>
          <Badge variant={statusColors[order.status]} className="mt-2">
            {order.status.replace("_", " ")}
          </Badge>
        </div>
        <OrderActions order={order} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Order Items</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.OrderItem?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 font-semibold text-lg">
                  <span>Total</span>
                  <span>${order.totalCost?.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RSVPs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">RSVPs ({order.RSVP?.length || 0})</h2>
              </div>
            </CardHeader>
            <CardContent>
              {order.RSVP && order.RSVP.length > 0 ? (
                <div className="space-y-3">
                  {order.RSVP.map((rsvp) => (
                    <div key={rsvp.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{rsvp.User?.name || rsvp.User?.email}</p>
                        <p className="text-sm text-gray-600">
                          Submitted {format(new Date(rsvp.submittedAt), "MMM d 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No RSVPs yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">RSVP Link</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Share this link with your team to collect their preferences.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rsvpUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 border rounded-lg truncate"
                />
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {order.rsvpDeadline && (
                <p className="text-sm text-gray-600">
                  Deadline: {format(new Date(order.rsvpDeadline), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </CardContent>
          </Card>

          {order.Menu?.CulturalCelebration && (
            <Card>
              <CardContent className="py-4">
                <Badge variant="info" className="mb-2">Cultural Celebration</Badge>
                <p className="font-medium">{order.Menu.CulturalCelebration.name}</p>
                {order.Menu.CulturalCelebration.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {order.Menu.CulturalCelebration.description}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
