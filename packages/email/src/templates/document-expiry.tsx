import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import { productBrand } from "@hrms-app/config/brand";

interface DocumentExpiryEmailProps {
  employeeName: string;
  documentType: string;
  documentName: string;
  expiryDate: string;
  daysRemaining: number;
  dashboardUrl: string;
  appName?: string;
}

type UrgencyLevel = "high" | "medium" | "normal";

function getUrgency(days: number): UrgencyLevel {
  if (days <= 7) return "high";
  if (days <= 30) return "medium";
  return "normal";
}

const urgencyConfig: Record<UrgencyLevel, { bg: string; text: string; label: string }> = {
  high: { bg: "#fef2f2", text: "#991b1b", label: "Expiring Soon" },
  medium: { bg: "#fffbeb", text: "#92400e", label: "Expiring" },
  normal: { bg: "#f0fdf4", text: "#166534", label: "Upcoming Expiry" },
};

const styles = {
  body: {
    fontFamily: "'Segoe UI', 'IBM Plex Sans Arabic', Tahoma, sans-serif",
    fontSize: "16px",
    backgroundColor: "#f4f4f5",
    padding: "32px 16px",
    margin: 0,
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#006C35",
    padding: "24px 32px",
  },
  headerText: {
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "bold",
    margin: 0,
  },
  content: {
    padding: "32px",
  },
  heading: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  paragraph: {
    color: "#1e293b",
    lineHeight: "1.6",
    margin: "0 0 24px 0",
  },
  warningBar: {
    backgroundColor: "#fffbeb",
    borderLeft: "4px solid #f59e0b",
    padding: "12px 16px",
    marginBottom: "24px",
    borderRadius: "4px",
  },
  warningText: {
    color: "#92400e",
    fontSize: "14px",
    fontWeight: "600",
    margin: 0,
  },
  urgencyContainer: {
    textAlign: "center" as const,
    marginBottom: "24px",
  },
  urgencyBadge: {
    display: "inline-block",
    padding: "8px 20px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: "700",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginBottom: "24px",
  },
  tableRow: {
    borderBottom: "1px solid #e2e8f0",
  },
  labelCell: {
    padding: "10px 0",
    color: "#64748b",
    fontSize: "14px",
    verticalAlign: "top",
    width: "140px",
  },
  valueCell: {
    padding: "10px 0",
    color: "#1e293b",
    fontWeight: "500",
  },
  daysValue: {
    fontWeight: "700",
    fontSize: "18px",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#006C35",
    color: "#ffffff",
    padding: "12px 28px",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "15px",
  },
  hr: {
    borderColor: "#e2e8f0",
    margin: "32px 0 16px 0",
  },
  footer: {
    color: "#94a3b8",
    fontSize: "13px",
    margin: 0,
  },
};

export function DocumentExpiryEmail({
  employeeName,
  documentType,
  documentName,
  expiryDate,
  daysRemaining,
  dashboardUrl,
  appName = productBrand.name,
}: DocumentExpiryEmailProps) {
  const urgency = getUrgency(daysRemaining);
  const config = urgencyConfig[urgency];

  return (
    <Html>
      <Head />
      <Preview>
        {documentName} is expiring in {String(daysRemaining)} days on {appName}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.headerText}>{appName}</Text>
          </Section>
          <Section style={styles.content}>
            <Text style={styles.heading}>Document Expiry Notice</Text>
            <Text style={styles.paragraph}>
              Hi {employeeName}, the following document is approaching its
              expiration date.
            </Text>
            <Section style={styles.warningBar}>
              <Text style={styles.warningText}>
                Please update this document before it expires to avoid any
                disruptions.
              </Text>
            </Section>
            <div style={styles.urgencyContainer}>
              <span
                style={{
                  ...styles.urgencyBadge,
                  backgroundColor: config.bg,
                  color: config.text,
                }}
              >
                {config.label} &middot; {daysRemaining} day
                {daysRemaining !== 1 ? "s" : ""} remaining
              </span>
            </div>
            <table style={styles.table}>
              <tbody>
                <tr style={styles.tableRow}>
                  <td style={styles.labelCell}>Document</td>
                  <td style={styles.valueCell}>{documentName}</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.labelCell}>Type</td>
                  <td style={styles.valueCell}>{documentType}</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.labelCell}>Expiry Date</td>
                  <td style={styles.valueCell}>{expiryDate}</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.labelCell}>Days Remaining</td>
                  <td style={{ ...styles.valueCell, ...styles.daysValue }}>
                    {daysRemaining}
                  </td>
                </tr>
              </tbody>
            </table>
            <Button href={dashboardUrl} style={styles.button}>
              View in Dashboard
            </Button>
            <Hr style={styles.hr} />
            <Text style={styles.footer}>
              This is an automated notification from {appName}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default DocumentExpiryEmail;
