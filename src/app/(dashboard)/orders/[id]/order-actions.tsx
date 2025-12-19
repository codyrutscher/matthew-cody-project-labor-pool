"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, Check, X } from "lucide-react";

interface OrderActionsProps {
  order: {
    id: string;
    status: string;
  };
}

export function OrderActions({ order }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {order.status === "DRAFT" && (
        <Button onClick={() => updateStatus("RSVP_OPEN")} loading={loading}>
          <Send className="h-4 w-4 mr-2" />
          Open RSVP
        </Button>
      )}
      {order.status === "RSVP_OPEN" && (
        <Button onClick={() => updateStatus("RSVP_CLOSED")} loading={loading}>
          <X className="h-4 w-4 mr-2" />
          Close RSVP
        </Button>
      )}
      {order.status === "RSVP_CLOSED" && (
        <Button onClick={() => updateStatus("CONFIRMED")} loading={loading}>
          <Check className="h-4 w-4 mr-2" />
          Confirm Order
        </Button>
      )}
    </div>
  );
}
