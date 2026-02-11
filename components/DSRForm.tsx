// DSR Form component — Create / Edit Daily Shipment Report
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";

export interface DSRData {
  id?: string;
  sNo: string;
  trlNo: string;
  shipperName: string;
  shippingLine: string;
  mbl: string;
  hbl: string;
  shipmentType: string;
  cntrQty: string;
  cntrType: string;
  pol: string;
  pod: string;
  fpod: string;
  etdPoi: string;
  etaPod: string;
  bro: string;
  broReceived: boolean;
  jobStatus: string;
  clientEmail: string;
}

const defaultDSR: DSRData = {
  sNo: "",
  trlNo: "",
  shipperName: "",
  shippingLine: "",
  mbl: "",
  hbl: "",
  shipmentType: "SEA",
  cntrQty: "",
  cntrType: "",
  pol: "",
  pod: "",
  fpod: "",
  etdPoi: new Date().toISOString().split("T")[0],
  etaPod: new Date().toISOString().split("T")[0],
  bro: "",
  broReceived: false,
  jobStatus: "IN TRANSIT",
  clientEmail: "",
};

interface DSRFormProps {
  initialData?: DSRData;
  mode?: "create" | "edit";
}

export default function DSRForm({
  initialData,
  mode = "create",
}: DSRFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<DSRData>(initialData || defaultDSR);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const set = (field: keyof DSRData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Save draft ─────────────────────────────
  const saveDraft = async () => {
    if (!form.shipperName || !form.clientEmail) {
      toast.error("Shipper Name and Client Email are required");
      return;
    }
    setSaving(true);

    try {
      const url =
        mode === "edit" && form.id
          ? `/api/dsr?id=${form.id}`
          : "/api/dsr";
      const method = mode === "edit" && form.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Save failed");
      } else {
        toast.success("DSR saved as draft");
        if (mode === "create" && data.dsr?.id) {
          setTimeout(() => router.push("/dashboard/dsr"), 1000);
        }
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  };

  // ── Save & Send ────────────────────────────
  const saveAndSend = async () => {
    if (!form.shipperName || !form.clientEmail) {
      toast.error("Shipper Name and Client Email are required");
      return;
    }
    setSending(true);

    try {
      // Save first
      let dsrId = form.id;

      if (!dsrId) {
        const saveRes = await fetch("/api/dsr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) {
          toast.error(saveData.error || "Save failed");
          setSending(false);
          return;
        }
        dsrId = saveData.dsr.id;
      } else {
        // Update first
        const updateRes = await fetch(`/api/dsr?id=${dsrId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!updateRes.ok) {
          const updateData = await updateRes.json();
          toast.error(updateData.error || "Update failed");
          setSending(false);
          return;
        }
      }

      // Send email
      const sendRes = await fetch("/api/dsr/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dsrId }),
      });
      const sendData = await sendRes.json();

      if (!sendRes.ok) {
        toast.error(sendData.error || "Send failed");
      } else {
        toast.success(sendData.devMode
          ? "DSR marked as sent (email skipped — no API key)"
          : "DSR sent successfully!");
        setTimeout(() => router.push("/dashboard/dsr"), 1500);
      }
    } catch {
      toast.error("Network error during send");
    }
    setSending(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "edit" ? "Edit DSR" : "New Daily Shipment Report"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Row 1: Basic */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="sNo">S.No</Label>
            <Input
              id="sNo"
              value={form.sNo}
              onChange={(e) => set("sNo", e.target.value)}
              placeholder="001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trlNo">TRL No</Label>
            <Input
              id="trlNo"
              value={form.trlNo}
              onChange={(e) => set("trlNo", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipperName">
              Shipper / Client <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shipperName"
              value={form.shipperName}
              onChange={(e) => set("shipperName", e.target.value)}
              placeholder="ABC Exports Pvt Ltd"
            />
          </div>
        </div>

        {/* Row 2: Shipping */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Shipping Line</Label>
            <Input
              value={form.shippingLine}
              onChange={(e) => set("shippingLine", e.target.value)}
              placeholder="Maersk"
            />
          </div>
          <div className="space-y-2">
            <Label>Shipment Type</Label>
            <Select
              value={form.shipmentType}
              onValueChange={(v) => set("shipmentType", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEA">SEA</SelectItem>
                <SelectItem value="AIR">AIR</SelectItem>
                <SelectItem value="LCL">LCL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Job Status</Label>
            <Select
              value={form.jobStatus}
              onValueChange={(v) => set("jobStatus", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN TRANSIT">IN TRANSIT</SelectItem>
                <SelectItem value="JOB CLOSED">JOB CLOSED</SelectItem>
                <SelectItem value="BOOKING CONFIRMED">BOOKING CONFIRMED</SelectItem>
                <SelectItem value="CUSTOMS CLEARANCE">CUSTOMS CLEARANCE</SelectItem>
                <SelectItem value="DELIVERED">DELIVERED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Bills */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>MBL (Master Bill)</Label>
            <Input
              value={form.mbl}
              onChange={(e) => set("mbl", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>HBL (House Bill)</Label>
            <Input
              value={form.hbl}
              onChange={(e) => set("hbl", e.target.value)}
            />
          </div>
        </div>

        {/* Row 4: Container */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Container Qty</Label>
            <Input
              value={form.cntrQty}
              onChange={(e) => set("cntrQty", e.target.value)}
              placeholder="2"
            />
          </div>
          <div className="space-y-2">
            <Label>Container Type</Label>
            <Input
              value={form.cntrType}
              onChange={(e) => set("cntrType", e.target.value)}
              placeholder="40HC"
            />
          </div>
        </div>

        {/* Row 5: Ports */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>POL (Port of Loading)</Label>
            <Input
              value={form.pol}
              onChange={(e) => set("pol", e.target.value)}
              placeholder="INNSA"
            />
          </div>
          <div className="space-y-2">
            <Label>POD (Port of Discharge)</Label>
            <Input
              value={form.pod}
              onChange={(e) => set("pod", e.target.value)}
              placeholder="USLAX"
            />
          </div>
          <div className="space-y-2">
            <Label>FPOD (Final Destination)</Label>
            <Input
              value={form.fpod}
              onChange={(e) => set("fpod", e.target.value)}
              placeholder="Chicago, IL"
            />
          </div>
        </div>

        {/* Row 6: Dates */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>ETD (Port of Issue)</Label>
            <Input
              type="date"
              value={form.etdPoi}
              onChange={(e) => set("etdPoi", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>ETA (Port of Discharge)</Label>
            <Input
              type="date"
              value={form.etaPod}
              onChange={(e) => set("etaPod", e.target.value)}
            />
          </div>
        </div>

        {/* Row 7: BRO */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>BRO</Label>
            <Input
              value={form.bro}
              onChange={(e) => set("bro", e.target.value)}
            />
          </div>
          <div className="flex items-end gap-3 pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={form.broReceived}
                onChange={(e) => set("broReceived", e.target.checked)}
              />
              BRO Received
            </label>
          </div>
        </div>

        {/* Row 8: Client email */}
        <div className="space-y-2">
          <Label htmlFor="clientEmail">
            Client Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="clientEmail"
            type="email"
            value={form.clientEmail}
            onChange={(e) => set("clientEmail", e.target.value)}
            placeholder="client@company.com"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={saving || sending}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Draft
          </Button>
          <Button onClick={saveAndSend} disabled={saving || sending}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Save &amp; Send Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
