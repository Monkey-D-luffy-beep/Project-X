"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DSRForm, { type DSRData } from "@/components/DSRForm";

export default function EditDSRPage() {
  const params = useParams();
  const router = useRouter();
  const [dsr, setDsr] = useState<DSRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    async function fetchDSR() {
      try {
        const res = await fetch(`/api/dsr?id=${params.id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load DSR");
        }
        const data = await res.json();
        if (data.sentAt) {
          setIsSent(true);
          setLoading(false);
          return;
        }
        // Format dates as YYYY-MM-DD strings for date inputs
        const fmt = (d: string | null) =>
          d ? new Date(d).toISOString().slice(0, 10) : "";
        setDsr({
          id: data.id,
          sNo: data.sNo ?? "",
          trlNo: data.trlNo ?? "",
          shipperName: data.shipperName ?? "",
          shippingLine: data.shippingLine ?? "",
          mbl: data.mbl ?? "",
          hbl: data.hbl ?? "",
          shipmentType: data.shipmentType ?? "SEA",
          cntrQty: data.cntrQty ?? "",
          cntrType: data.cntrType ?? "",
          pol: data.pol ?? "",
          pod: data.pod ?? "",
          fpod: data.fpod ?? "",
          etdPoi: fmt(data.etdPoi),
          etaPod: fmt(data.etaPod),
          bro: data.bro ?? "",
          broReceived: data.broReceived ?? false,
          jobStatus: data.jobStatus ?? "IN TRANSIT",
          clientEmail: data.clientEmail ?? "",
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchDSR();
  }, [params.id]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading DSR…</p>
      </div>
    );

  if (error)
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <button
          onClick={() => router.push("/dashboard/dsr")}
          className="text-sm underline"
        >
          Back to DSR list
        </button>
      </div>
    );

  if (isSent)
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-muted-foreground">
          This DSR has already been sent and cannot be edited.
        </p>
        <button
          onClick={() => router.push("/dashboard/dsr")}
          className="text-sm underline"
        >
          Back to DSR list
        </button>
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit DSR</h1>
        <p className="text-muted-foreground">
          Update shipment details before sending.
        </p>
      </div>
      <DSRForm mode="edit" initialData={dsr ?? undefined} />
    </div>
  );
}
