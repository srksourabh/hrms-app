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

interface LeaveRequestEmailProps {
  employeeName: string;
  managerName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
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
  statusBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "600",
    textTransform: "capitalize" as const,
    backgroundColor: "#fef3c7",
    color: "#92400e",
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

export function LeaveRequestEmail({
  employeeName,
  managerName,
  leaveType,
  startDate,
  endDate,
  status,
  dashboardUrl,
  appName = productBrand.name,
}: LeaveRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {employeeName} has submitted a {leaveType} leave request on {appName}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.headerText}>{appName}</Text>
          </Section>
          <Section style={styles.content}>
            <Text style={styles.heading}>Leave Request</Text>
            <Text style={styles.paragraph}>
              Hi {managerName}, a new leave request requires your review.
            </Text>
            <table style={styles.table}>
              <tbody>
                <tr style={styles.tableRow}>
                  <td style={styles.labelCell}>Employee</td>
                  <td style={styles.valueCell}>{employeeName}</td>
                </tr>
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
                <tr style={styles.tableRow}>
                  <td style={styles.labelCell}>Status</td>
                  <td style={styles.valueCell}>
                    <span style={styles.statusBadge}>{status}</span>
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

export default LeaveRequestEmail;
