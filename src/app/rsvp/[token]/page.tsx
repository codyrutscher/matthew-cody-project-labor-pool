"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  dietaryTags: string[];
}

interface OrderData {
  id: string;
  status: string;
  rsvpDeadline: string | null;
  menu: {
    weekOf: string;
    cuisineType: { name: string };
    culturalCelebration: { name: string } | null;
    items: MenuItem[];
  };
  office: { name: string };
}

export default function RSVPPage() {
  const params = useParams();
  const token = params.token as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/rsvp/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setOrder(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load RSVP");
        setLoading(false);
      });
  }, [token]);

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: prev[itemId] ? 0 : 1,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/rsvp/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedItems: Object.entries(selectedItems)
            .filter(([, qty]) => qty > 0)
            .map(([itemId, quantity]) => ({ itemId, quantity })),
          dietaryNotes,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit RSVP");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">RSVP Submitted!</h2>
            <p className="text-gray-600">Thank you for your response.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) return null;

  const isOpen = order.status === "RSVP_OPEN";
  const isPastDeadline = order.rsvpDeadline && new Date(order.rsvpDeadline) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{order.office.name}</h1>
          <p className="text-gray-600">Catering RSVP</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{order.menu.cuisineType.name}</h2>
                <p className="text-gray-600">
                  Week of {format(new Date(order.menu.weekOf), "MMMM d, yyyy")}
                </p>
              </div>
              {order.menu.culturalCelebration && (
                <Badge variant="info">🎉 {order.menu.culturalCelebration.name}</Badge>
              )}
            </div>
            {order.rsvpDeadline && (
              <p className="text-sm text-gray-600 mt-2">
                Deadline: {format(new Date(order.rsvpDeadline), "MMMM d 'at' h:mm a")}
              </p>
            )}
          </CardHeader>
        </Card>

        {!isOpen || isPastDeadline ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">
                {isPastDeadline ? "The RSVP deadline has passed." : "RSVP is not currently open."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Select Your Preferences</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.menu.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedItems[item.id]
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                        {item.dietaryTags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {item.dietaryTags.map((tag) => (
                              <Badge key={tag} variant="default">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedItems[item.id]
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedItems[item.id] && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">Dietary Notes (Optional)</h3>
              </CardHeader>
              <CardContent>
                <textarea
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="Any allergies or special requests..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              loading={submitting}
              disabled={Object.values(selectedItems).every((v) => !v)}
            >
              Submit RSVP
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
