"use client";

import { useEffect, useState } from "react";
import { Search, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { dateShort } from "@/lib/format";
import { PageHeader } from "@/components/shell/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/users/customers")
      .then((res) => setCustomers(res.data || []))
      .catch((err) => toast.error(apiError(err, "Failed to load customers")))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Everyone who has signed in to your storefront."
      />

      <div className="relative max-w-sm mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers…"
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  No customers yet.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name || "Guest"}</div>
                    {c.address && (
                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                        {c.address}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                      {c.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" /> {c.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{c._count?.orders ?? 0}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateShort(c.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
