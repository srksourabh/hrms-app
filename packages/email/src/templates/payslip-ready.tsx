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

interface PayslipReadyEmailProps {
  employeeName: string;
  period: string;
  netPay: string;
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
  summaryCard: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
  },
  summaryLabel: {
    color: "#64748b",
    fontSize: "14px",
    margin: 0,
  },
  summaryValue: {
    color: "#1e293b",
    fontWeight: "600",
    margin: 0,
  },
  netPayRow: {
    borderTop: "2px solid #006C35",
    marginTop: "8px",
    paddingTop: "12px",
  },
  netPayLabel: {
    color: "#006C35",
    fontSize: "16px",
    fontWeight: "700",
    margin: 0,
  },
  netPayValue: {
    color: "#006C35",
    fontSize: "22px",
    fontWeight: "bold",
    margin: 0,
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

export function PayslipReadyEmail({
  employeeName,
  period,
  netPay,
  dashboardUrl,
  appName = productBrand.name,
}: PayslipReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your payslip for {period} is now available on {appName}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.headerText}>{appName}</Text>
          </Section>
          <Section style={styles.content}>
            <Text style={styles.heading}>Payslip Ready</Text>
            <Text style={styles.paragraph}>
              Hi {employeeName}, your payslip for {period} is now available.
            </Text>
            <Section style={styles.summaryCard}>
              <div style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Period</Text>
                <Text style={styles.summaryValue}>{period}</Text>
              </div>
              <div style={{ ...styles.summaryRow, ...styles.netPayRow }}>
                <Text style={styles.netPayLabel}>Net Pay</Text>
                <Text style={styles.netPayValue}>{netPay} SAR</Text>
              </div>
            </Section>
            <Button href={dashboardUrl} style={styles.button}>
              View Payslip
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

export default PayslipReadyEmail;
