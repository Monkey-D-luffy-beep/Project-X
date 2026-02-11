"use client";

import DSRForm from "@/components/DSRForm";

export default function NewDSRPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Create New DSR
        </h1>
        <p className="text-muted-foreground">
          Fill in shipment details. Save as draft or send directly to the client.
        </p>
      </div>
      <DSRForm mode="create" />
    </div>
  );
}
