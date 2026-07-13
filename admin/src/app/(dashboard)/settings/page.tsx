"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { PageHeader } from "@/components/shell/page-header";
import { ImageField } from "@/components/form/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "image" | "switch";
  hint?: string;
  placeholder?: string;
};

const SECTIONS: { title: string; description: string; fields: Field[] }[] = [
  {
    title: "Store Identity",
    description: "Your brand name and tagline shown across the storefront.",
    fields: [
      { key: "storeName", label: "Store name" },
      { key: "storeTagline", label: "Tagline" },
    ],
  },
  {
    title: "Announcement Bar",
    description: "The scrolling strip at the very top of every page.",
    fields: [
      { key: "announcementOn", label: "Show announcement bar", type: "switch" },
      { key: "announcementText", label: "Announcement text" },
    ],
  },
  {
    title: "Home Hero",
    description: "The large banner at the top of the home page.",
    fields: [
      { key: "heroBadge", label: "Badge / eyebrow" },
      { key: "heroTitle", label: "Headline" },
      { key: "heroQuote", label: "Quote", type: "textarea" },
      { key: "heroCtaLabel", label: "Button label" },
      { key: "heroImageUrl", label: "Hero image", type: "image" },
      { key: "brandStory", label: "Brand story", type: "textarea" },
    ],
  },
  {
    title: "Shipping",
    description: "Thresholds used to calculate delivery charges at checkout.",
    fields: [
      {
        key: "freeShippingThreshold",
        label: "Free shipping over (₹)",
        type: "number",
        hint: "Orders at or above this get free shipping.",
      },
      { key: "shippingFee", label: "Shipping fee (₹)", type: "number" },
    ],
  },
  {
    title: "Contact & Social",
    description: "Shown in the footer and on the contact page.",
    fields: [
      { key: "whatsapp", label: "WhatsApp number", placeholder: "+91 91678 00000" },
      { key: "supportPhone", label: "Support phone" },
      { key: "supportEmail", label: "Support email" },
      { key: "address", label: "Address", type: "textarea" },
      { key: "instagram", label: "Instagram URL" },
      { key: "facebook", label: "Facebook URL" },
      { key: "youtube", label: "YouTube URL" },
    ],
  },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => setValues(res.data || {}))
      .catch((err) => toast.error(apiError(err, "Failed to load settings")))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/settings", values);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(apiError(err, "Could not save settings"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="Everything here updates the storefront instantly."
      >
        <Button onClick={save} disabled={saving || loading}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {SECTIONS.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="font-display text-2xl">
                  {section.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {section.fields.map((field) => {
                  const value = values[field.key] ?? "";
                  if (field.type === "switch") {
                    return (
                      <label
                        key={field.key}
                        className="flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <span className="text-sm font-medium">{field.label}</span>
                        <Switch
                          checked={value === "true"}
                          onCheckedChange={(v) => set(field.key, v ? "true" : "false")}
                        />
                      </label>
                    );
                  }
                  if (field.type === "image") {
                    return (
                      <ImageField
                        key={field.key}
                        label={field.label}
                        value={value}
                        onChange={(url) => set(field.key, url)}
                      />
                    );
                  }
                  return (
                    <div key={field.key} className="flex flex-col gap-1.5">
                      <Label>{field.label}</Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          rows={3}
                          value={value}
                          onChange={(e) => set(field.key, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <Input
                          type={field.type === "number" ? "number" : "text"}
                          value={value}
                          onChange={(e) => set(field.key, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      )}
                      {field.hint && (
                        <p className="text-xs text-muted-foreground">{field.hint}</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end pb-4">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
