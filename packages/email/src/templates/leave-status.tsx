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

interface LeaveStatusEmailProps {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: "approved" | "rejected";
  reason?: string;
  dashboardUrl: string;
  appName?: string;
}

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
  statusBadgeContainer: {
    textAlign: "center" as const,
    marginBottom: "24px",
  },
  statusBadge: {
    display: "inline-block",
    padding: "8px 24px",
    borderRadius: "999px",
    fontSize: "16px",
    fontWeight: "700",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
  },
  badgeApproved: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeRejected: {
    backgroundColor: "#fef2f2",
    color: "#991b1b",
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
    width: "120px",
  },
  valueCell: {
    padding: "10px 0",
    color: "#1e293b",
    fontWeight: "500",
  },
  reasonBox: {
    backgroundColor: "#f8fafc",
    borderLeft: "4px solid #006C35",
    padding: "12px 16px",
    marginBottom: "24px",
    borderRadius: "4px",
  },
  reasonLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "600",
    margin: "0 0 4px 0",
  },
  reasonText: {
    color: "#1e293b",
    margin: 0,
    lineHeight: "1.5",
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

export function LeaveStatusEmail({
  employeeName,
  leaveType,
  startDate,
  endDate,
  status,
  reason,
  dashboardUrl,
  appName = productBrand.name,
}: LeaveStatusEmailProps) {
  const isApproved = status === "approved";

  return (
    <Html>
      <Head />
      <Preview>
        Your {leaveType} leave request has been {status} on {appName}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.headerText}>{appName}</Text>
          </Section>
          <Section style={styles.content}>
            <Text style={styles.heading}>
              Leave Request {isApproved ? "Approved" : "Rejected"}
            </Text>
            <Text style={styles.paragraph}>
              Hi {employeeName}, your {leaveType} leave request has been{" "}
              {status}.
            </Text>
            <div style={styles.statusBadgeContainer}>
              <span
                style={{
                  ...styles.statusBadge,
                  ...(isApproved ? styles.badgeApproved : styles.badgeRejected),
                }}
              >
                {status}
              </span>
            </div>
            <table style={styles.table}>
              <tbody>
                <tr style={styles.tableRow}>
                  <td style={styles.labelCell}>Leave Type</td>
                  <td style={styles.valueCell}>{leaveType}</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.labelCell}>Start Date</td>
                  <td style={styles.valueCell}>{startDate}</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.labelCell}>End Date</td>
                  <td style={styles.valueCell}>{endDate}</td>
                </tr>
              </tbody>
            </table>
            {reason && (
              <Section style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>
                  {isApproved ? "Note" : "Reason"}
                </Text>
                <Text style={styles.reasonText}>{reason}</Text>
              </Section>
            )}
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

export default LeaveStatusEmail;
