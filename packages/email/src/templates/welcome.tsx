import {
  Html,
  Body,
  Container,
  Text,
  Button,
  Head,
  Preview,
  Hr,
} from "@react-email/components";
import { productBrand } from "@hrms-app/config/brand";

interface WelcomeEmailProps {
  userName: string;
  appName?: string;
  dashboardUrl: string;
}

export function WelcomeEmail({ userName, appName = productBrand.name, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {appName}!</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", padding: "20px" }}>
        <Container>
          <Text style={{ fontSize: "24px", fontWeight: "bold" }}>
            Welcome to {appName}!
          </Text>
          <Text>Hi {userName},</Text>
          <Text>
            Your account has been created successfully. You can now access the
            dashboard to manage your HR operations.
          </Text>
          <Button
            href={dashboardUrl}
            style={{
              backgroundColor: "#000",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              display: "inline-block",
              marginTop: "16px",
            }}
          >
            Go to Dashboard
          </Button>
          <Hr style={{ marginTop: "32px" }} />
          <Text style={{ color: "#666", fontSize: "12px" }}>
            If you did not create this account, please ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
