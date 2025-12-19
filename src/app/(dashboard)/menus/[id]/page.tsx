import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

async function getMenu(id: string) {
  return prisma.menu.findUnique({
    where: { id },
    include: {
      cuisineType: true,
      culturalCelebration: true,
      items: { where: { available: true }, orderBy: { name: "asc" } },
    },
  });
}

export default async function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const menu = await getMenu(id);

  if (!menu) {
    notFound();
  }

  const dietaryColors: Record<string, string> = {
    vegetarian: "bg-green-100 text-green-800",
    vegan: "bg-emerald-100 text-emerald-800",
    "gluten-free": "bg-yellow-100 text-yellow-800",
    "dairy-free": "bg-blue-100 text-blue-800",
    "nut-free": "bg-orange-100 text-orange-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/menus">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menus
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{menu.cuisineType.name}</h1>
          <p className="text-gray-600">Week of {format(menu.weekOf, "MMMM d, yyyy")}</p>
          {menu.culturalCelebration && (
            <Badge variant="info" className="mt-2">
              🎉 {menu.culturalCelebration.name}
            </Badge>
          )}
        </div>
        <Link href={`/orders/new?menuId=${menu.id}`}>
          <Button>Create Order</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menu.items.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{item.name}</h3>
                <span className="text-lg font-bold text-indigo-600">
                  ${item.price.toFixed(2)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {item.description && (
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
              )}
              {item.dietaryTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.dietaryTags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        dietaryColors[tag.toLowerCase()] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {menu.items.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No items available for this menu yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
