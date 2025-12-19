"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import Link from "next/link";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  dietaryTags: string[];
}

interface Menu {
  id: string;
  weekOf: string;
  cuisineType: { name: string };
  items: MenuItem[];
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuId = searchParams.get("menuId");

  const [menu, setMenu] = useState<Menu | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (menuId) {
      fetch(`/api/menus/${menuId}`)
        .then((res) => res.json())
        .then((data) => {
          setMenu(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [menuId]);

  const updateQuantity = (itemId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta),
    }));
  };

  const totalCost = menu?.items.reduce(
    (sum, item) => sum + item.price * (quantities[item.id] || 0),
    0
  ) || 0;

  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  const handleSubmit = async () => {
    if (!menu || totalItems === 0) return;

    setSubmitting(true);
    try {
      const items = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, quantity]) => {
          const item = menu.items.find((i) => i.id === itemId)!;
          return { menuItemId: itemId, name: item.name, price: item.price, quantity };
        });

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId: menu.id, items }),
      });

      if (res.ok) {
        const order = await res.json();
        router.push(`/orders/${order.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!menu) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Please select a menu first</p>
        <Link href="/menus">
          <Button>Browse Menus</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/menus">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Order</h1>
        <p className="text-gray-600">{menu.cuisineType.name} - Week of {new Date(menu.weekOf).toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {menu.items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                    <p className="text-indigo-600 font-medium mt-1">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, -1)}
                      disabled={!quantities[item.id]}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantities[item.id] || 0}
                      onChange={(e) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [item.id]: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                      className="w-16 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <h2 className="text-lg font-semibold">Order Summary</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {Object.entries(quantities)
                  .filter(([, qty]) => qty > 0)
                  .map(([itemId, qty]) => {
                    const item = menu.items.find((i) => i.id === itemId)!;
                    return (
                      <div key={itemId} className="flex justify-between text-sm">
                        <span>
                          {item.name} x{qty}
                        </span>
                        <span>${(item.price * qty).toFixed(2)}</span>
                      </div>
                    );
                  })}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{totalItems} items</p>
              </div>

              <Button
                className="w-full"
                disabled={totalItems === 0 || submitting}
                loading={submitting}
                onClick={handleSubmit}
              >
                Create Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
