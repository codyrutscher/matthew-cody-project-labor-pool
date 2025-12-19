import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Copy, Send } from "lucide-react";
import { OrderActions } from "./order-actions";

async function getOrder(id: string, officeId: string) {
  return prisma.order.findFirst({
    where: { id, officeId },
    include: {
      menu: { include: { cuisineType: true, culturalCelebration: true } },
      items: true,
      rsvps: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
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
          <h1 className="text-2xl font-bold text-gray-900">{order.menu.cuisineType.name}</h1>
          <p className="text-gray-600">Week of {format(order.menu.weekOf, "MMMM d, yyyy")}</p>
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
                {order.items.map((item) => (
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
                <h2 className="text-lg font-semibold">RSVPs ({order.rsvps.length})</h2>
              </div>
            </CardHeader>
            <CardContent>
              {order.rsvps.length > 0 ? (
                <div className="space-y-3">
                  {order.rsvps.map((rsvp) => (
                    <div key={rsvp.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{rsvp.user.name || rsvp.user.email}</p>
                        <p className="text-sm text-gray-600">
                          Submitted {format(rsvp.submittedAt, "MMM d 'at' h:mm a")}
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
                  onClick={() => navigator.clipboard.writeText(rsvpUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {order.rsvpDeadline && (
                <p className="text-sm text-gray-600">
                  Deadline: {format(order.rsvpDeadline, "MMMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </CardContent>
          </Card>

          {order.menu.culturalCelebration && (
            <Card>
              <CardContent className="py-4">
                <Badge variant="info" className="mb-2">Cultural Celebration</Badge>
                <p className="font-medium">{order.menu.culturalCelebration.name}</p>
                {order.menu.culturalCelebration.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {order.menu.culturalCelebration.description}
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
