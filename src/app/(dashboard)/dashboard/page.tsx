import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Users, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { format, startOfWeek, addWeeks } from "date-fns";

async function getDashboardData(officeId: string) {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const nextWeekStart = addWeeks(thisWeekStart, 1);

  const [office, currentOrder, upcomingMenus, teamCount] = await Promise.all([
    prisma.office.findUnique({
      where: { id: officeId },
      include: { subscription: true },
    }),
    prisma.order.findFirst({
      where: {
        officeId,
        menu: { weekOf: { gte: thisWeekStart, lt: nextWeekStart } },
      },
      include: { menu: { include: { cuisineType: true } }, rsvps: true },
    }),
    prisma.menu.findMany({
      where: { weekOf: { gte: thisWeekStart }, publishedAt: { not: null } },
      include: { cuisineType: true, culturalCelebration: true },
      orderBy: { weekOf: "asc" },
      take: 3,
    }),
    prisma.user.count({ where: { officeId } }),
  ]);

  return { office, currentOrder, upcomingMenus, teamCount };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.officeId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No office found</h2>
        <p className="text-gray-600 mt-2">Please contact support to set up your office.</p>
      </div>
    );
  }

  const { office, currentOrder, upcomingMenus, teamCount } = await getDashboardData(
    session.user.officeId
  );

  const statusColors: Record<string, "default" | "success" | "warning" | "info"> = {
    DRAFT: "default",
    RSVP_OPEN: "info",
    RSVP_CLOSED: "warning",
    CONFIRMED: "success",
    DELIVERED: "success",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600">{office?.name} Dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <UtensilsCrossed className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-lg font-semibold">
                {currentOrder ? currentOrder.menu.cuisineType.name : "No order"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget</p>
              <p className="text-lg font-semibold">
                ${office?.budgetLimit?.toFixed(2) || "Not set"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Team Size</p>
              <p className="text-lg font-semibold">{teamCount} members</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">RSVPs</p>
              <p className="text-lg font-semibold">
                {currentOrder?.rsvps.length || 0} / {teamCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Order */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Current Order</h2>
              {currentOrder && (
                <Badge variant={statusColors[currentOrder.status]}>
                  {currentOrder.status.replace("_", " ")}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentOrder ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Cuisine</p>
                  <p className="font-medium">{currentOrder.menu.cuisineType.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Week of</p>
                  <p className="font-medium">
                    {format(currentOrder.menu.weekOf, "MMMM d, yyyy")}
                  </p>
                </div>
                {currentOrder.rsvpDeadline && (
                  <div>
                    <p className="text-sm text-gray-600">RSVP Deadline</p>
                    <p className="font-medium">
                      {format(currentOrder.rsvpDeadline, "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                )}
                <Link href={`/orders/${currentOrder.id}`}>
                  <Button variant="outline" className="w-full">
                    View Order Details
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">No order for this week yet</p>
                <Link href="/menus">
                  <Button>Browse Menus</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Menus */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upcoming Menus</h2>
              <Link href="/menus" className="text-sm text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingMenus.length > 0 ? (
              <div className="space-y-4">
                {upcomingMenus.map((menu) => (
                  <div
                    key={menu.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{menu.cuisineType.name}</p>
                      <p className="text-sm text-gray-600">
                        Week of {format(menu.weekOf, "MMM d")}
                      </p>
                      {menu.culturalCelebration && (
                        <Badge variant="info" className="mt-1">
                          {menu.culturalCelebration.name}
                        </Badge>
                      )}
                    </div>
                    <Link href={`/menus/${menu.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 py-6">
                No upcoming menus available yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
