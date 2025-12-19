"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Office {
  id: string;
  name: string;
  address: string | null;
  budgetLimit: number | null;
  dietaryRestrictions: string[] | null;
  cateringMaterials: string | null;
}

export default function SettingsPage() {
  const [office, setOffice] = useState<Office | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    budgetLimit: "",
    cateringMaterials: "",
  });

  useEffect(() => {
    fetch("/api/office")
      .then((res) => res.json())
      .then((data) => {
        setOffice(data);
        setFormData({
          name: data.name || "",
          address: data.address || "",
          budgetLimit: data.budgetLimit?.toString() || "",
          cateringMaterials: data.cateringMaterials || "",
        });
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await fetch("/api/office", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budgetLimit: formData.budgetLimit ? parseFloat(formData.budgetLimit) : null,
        }),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Office Settings</h1>
        <p className="text-gray-600">Manage your office profile and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Office Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Office Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Catering Preferences</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Weekly Budget Limit ($)"
              type="number"
              value={formData.budgetLimit}
              onChange={(e) => setFormData({ ...formData, budgetLimit: e.target.value })}
              placeholder="500.00"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catering Materials Needed
              </label>
              <textarea
                value={formData.cateringMaterials}
                onChange={(e) => setFormData({ ...formData, cateringMaterials: e.target.value })}
                placeholder="Disposable plates, cutlery, napkins..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" loading={saving}>
          Save Changes
        </Button>
      </form>
    </div>
  );
}
