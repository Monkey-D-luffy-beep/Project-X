// DSR Email Template (React Email) — Professional branded shipment report

import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Row,
  Column,
  Hr,
} from "@react-email/components";

interface DSREmailProps {
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
  creatorName: string;
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "24px",
  borderRadius: "8px",
  maxWidth: "600px",
};

const heading = {
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: "#1a1a1a",
  margin: "0 0 4px",
};

const subheading = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "0 0 20px",
};

const tableRow = {
  borderBottom: "1px solid #e5e7eb",
};

const labelCell = {
  padding: "8px 12px",
  fontSize: "13px",
  color: "#6b7280",
  width: "40%",
  verticalAlign: "top" as const,
};

const valueCell = {
  padding: "8px 12px",
  fontSize: "13px",
  color: "#1a1a1a",
  fontWeight: "600" as const,
};

const statusBadge = (status: string) => ({
  display: "inline-block" as const,
  padding: "3px 10px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "bold" as const,
  backgroundColor:
    status === "JOB CLOSED"
      ? "#dcfce7"
      : status === "IN TRANSIT"
        ? "#fef3c7"
        : "#dbeafe",
  color:
    status === "JOB CLOSED"
      ? "#166534"
      : status === "IN TRANSIT"
        ? "#92400e"
        : "#1e40af",
});

const footer = {
  fontSize: "11px",
  color: "#9ca3af",
  textAlign: "center" as const,
  marginTop: "24px",
};

export default function DSRTemplate({
  sNo = "",
  trlNo = "",
  shipperName = "Sample Shipper",
  shippingLine = "",
  mbl = "",
  hbl = "",
  shipmentType = "SEA",
  cntrQty = "",
  cntrType = "",
  pol = "INNSA",
  pod = "USLAX",
  fpod = "",
  etdPoi = "2025-01-15",
  etaPod = "2025-02-15",
  bro = "",
  broReceived = false,
  jobStatus = "IN TRANSIT",
  creatorName = "CS Team",
}: DSREmailProps) {
  const fields: [string, string][] = [
    ["S.No", sNo],
    ["TRL No", trlNo],
    ["Shipper / Client", shipperName],
    ["Shipping Line", shippingLine],
    ["MBL", mbl],
    ["HBL", hbl],
    ["Shipment Type", shipmentType],
    ["Container Qty", cntrQty],
    ["Container Type", cntrType],
    ["POL", pol],
    ["POD", pod],
    ["FPOD", fpod],
    ["ETD (Port of Issue)", etdPoi],
    ["ETA (Port of Discharge)", etaPod],
    ["BRO", bro],
    ["BRO Received", broReceived ? "Yes" : "No"],
  ];

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section>
            <Text style={heading}>
              🐯 Daily Shipment Report
            </Text>
            <Text style={subheading}>
              {shipperName} — {pol} → {pod} | {shipmentType}
            </Text>
          </Section>

          <Hr style={{ borderColor: "#e5e7eb", margin: "0 0 16px" }} />

          {/* Job Status */}
          <Section style={{ marginBottom: "16px" }}>
            <Text style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 6px" }}>
              Job Status
            </Text>
            <Text style={{ margin: "0" }}>
              <span style={statusBadge(jobStatus)}>{jobStatus}</span>
            </Text>
          </Section>

          {/* Shipment Details Table */}
          <Section
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            {fields.map(([label, value], idx) => (
              <Row key={idx} style={idx < fields.length - 1 ? tableRow : {}}>
                <Column style={labelCell}>{label}</Column>
                <Column style={valueCell}>{value || "—"}</Column>
              </Row>
            ))}
          </Section>

          <Hr style={{ borderColor: "#e5e7eb", margin: "20px 0" }} />

          {/* Footer */}
          <Text style={footer}>
            Sent by {creatorName} via TigerOps | This is an automated shipment
            update. Please do not reply directly.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
