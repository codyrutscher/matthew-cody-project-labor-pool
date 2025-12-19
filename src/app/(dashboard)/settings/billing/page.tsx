"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Check } from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: string | null;
}

interface Office {
  name: string;
  subscription: Subscription | null;
}

export default function BillingPage() {
  const [office, setOffice] = useState<Office | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/office")
      .then((res) => res.json())
      .then((data) => {
        setOffice(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  const subscription = office?.subscription;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription and payment methods</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Current Plan</h2>
            {subscription && (
              <Badge variant={subscription.status === "ACTIVE" ? "success" : "warning"}>
                {subscription.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold">Weekly Catering Subscription</p>
                  <p className="text-sm text-gray-600">
                    Billed {subscription.billingCycle}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Plan Features</h3>
                <ul className="space-y-2">
                  {[
                    "Weekly cuisine rotation",
                    "Cultural celebration menus",
                    "RSVP system for team",
                    "Budget tracking",
                    "2-week advance menu preview",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {subscription.currentPeriodEnd && (
                <p className="text-sm text-gray-600">
                  Next billing date:{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">No active subscription</p>
              <Button>Subscribe Now</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Payment Method</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded">
                <CreditCard className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-600">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
