"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plus,
  Send,
  Trash2,
  Loader2,
  Mail,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface DSR {
  id: string;
  sNo: string;
  trlNo: string;
  shipperName: string;
  shippingLine: string;
  shipmentType: string;
  pol: string;
  pod: string;
  jobStatus: string;
  clientEmail: string;
  sentAt: string | null;
  createdAt: string;
  creator: { name: string; email: string };
}

function statusBadge(status: string) {
  switch (status) {
    case "JOB CLOSED":
      return "success" as const;
    case "IN TRANSIT":
      return "warning" as const;
    case "DELIVERED":
      return "success" as const;
    default:
      return "secondary" as const;
  }
}

export default function DSRListPage() {
  const [dsrs, setDsrs] = useState<DSR[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchDsrs = useCallback(async () => {
    setLoading(true);
    const params = tab !== "all" ? `?status=${tab}` : "";
    try {
      const res = await fetch(`/api/dsr${params}`);
      const data = await res.json();
      setDsrs(data.dsrs || []);
    } catch {
      setDsrs([]);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchDsrs();
  }, [fetchDsrs]);

  const sendDsr = async (id: string) => {
    if (!confirm("Send this DSR email to the client?")) return;
    setSendingId(id);
    try {
      await fetch("/api/dsr/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dsrId: id }),
      });
      await fetchDsrs();
    } catch {
      // handled
    }
    setSendingId(null);
  };

  const deleteDsr = async (id: string) => {
    if (!confirm("Delete this DSR draft?")) return;
    await fetch(`/api/dsr?id=${id}`, { method: "DELETE" });
    await fetchDsrs();
  };

  const drafts = dsrs.filter((d) => !d.sentAt);
  const sent = dsrs.filter((d) => d.sentAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Daily Shipment Reports
          </h1>
          <p className="text-muted-foreground">
            Create, manage and send shipment reports to clients
          </p>
        </div>
        <Link href="/dashboard/dsr/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New DSR
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total DSRs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dsrs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drafts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {sent.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        {["all", "draft", "sent"].map((t) => (
          <TabsContent key={t} value={t} className="mt-4">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Shipper</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dsrs.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="py-8 text-center text-muted-foreground"
                          >
                            No DSRs found. Create one to get started.
                          </TableCell>
                        </TableRow>
                      )}
                      {dsrs.map((dsr) => (
                        <TableRow key={dsr.id}>
                          <TableCell className="font-mono text-muted-foreground">
                            {dsr.sNo || "—"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {dsr.shipperName}
                          </TableCell>
                          <TableCell>
                            {dsr.pol} → {dsr.pod}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{dsr.shipmentType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge(dsr.jobStatus)}>
                              {dsr.jobStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[140px] truncate text-muted-foreground">
                            {dsr.clientEmail}
                          </TableCell>
                          <TableCell>
                            {dsr.sentAt ? (
                              <Badge variant="success">Sent</Badge>
                            ) : (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(dsr.createdAt).toLocaleDateString("en-IN")}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {!dsr.sentAt && (
                                <>
                                  <Link href={`/dashboard/dsr/${dsr.id}`}>
                                    <Button size="sm" variant="ghost" title="Edit">
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Send"
                                    onClick={() => sendDsr(dsr.id)}
                                    disabled={sendingId === dsr.id}
                                  >
                                    {sendingId === dsr.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Send className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    title="Delete"
                                    onClick={() => deleteDsr(dsr.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
