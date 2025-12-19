import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, startOfWeek } from "date-fns";
import Link from "next/link";

async function getMenus() {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });

  return prisma.menu.findMany({
    where: {
      weekOf: { gte: thisWeekStart },
      publishedAt: { not: null },
    },
    include: {
      cuisineType: true,
      culturalCelebration: true,
      items: true,
    },
    orderBy: { weekOf: "asc" },
  });
}

export default async function MenusPage() {
  const menus = await getMenus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upcoming Menus</h1>
        <p className="text-gray-600">Browse and order from our weekly rotating cuisines</p>
      </div>

      {menus.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menu) => (
            <Card key={menu.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-4xl">🍽️</span>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{menu.cuisineType.name}</h3>
                    <p className="text-sm text-gray-600">
                      Week of {format(menu.weekOf, "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>

                {menu.culturalCelebration && (
                  <Badge variant="info" className="mb-3">
                    🎉 {menu.culturalCelebration.name}
                  </Badge>
                )}

                <p className="text-sm text-gray-600 mb-4">
                  {menu.items.length} items available
                </p>

                <div className="flex gap-2">
                  <Link href={`/menus/${menu.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Menu
                    </Button>
                  </Link>
                  <Link href={`/orders/new?menuId=${menu.id}`} className="flex-1">
                    <Button className="w-full">Order</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No menus available at the moment.</p>
            <p className="text-sm text-gray-500 mt-2">
              Check back soon for upcoming weekly menus!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
