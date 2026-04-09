export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <section className="space-y-6 text-sm leading-relaxed text-foreground/80">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or using this GIS web application, you agree to these Terms of
            Service. If you do not agree, you may not use the service.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">2. Service Description</h2>
          <p>
            We provide a web-based geographic information system for creating, managing,
            analyzing, and sharing geospatial data. Features vary by subscription plan.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">3. Your Data</h2>
          <p>
            You retain ownership of all geospatial data and content you upload or create.
            We do not claim any intellectual property rights over your data. You grant us
            a limited license to store, process, and display your data solely to provide
            the service.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">4. Acceptable Use</h2>
          <p>
            You agree not to use the service to store or distribute illegal content,
            attempt to gain unauthorized access to other users' data, reverse engineer
            the platform, or exceed reasonable usage limits.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">5. Account Security</h2>
          <p>
            You are responsible for maintaining the security of your account credentials.
            Notify us immediately of any unauthorized access. We recommend enabling
            multi-factor authentication.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">6. Service Availability</h2>
          <p>
            We strive for high availability but do not guarantee uninterrupted service.
            Planned maintenance windows will be communicated in advance when possible.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">7. Termination</h2>
          <p>
            You may terminate your account at any time. Upon termination, your data will
            be deleted in accordance with our Privacy Policy. We reserve the right to
            suspend accounts that violate these terms.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
          <p>
            The service is provided "as is" without warranties. We are not liable for
            data loss, inaccuracies in geospatial analysis, or decisions made based on
            data processed through the platform.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">9. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the service
            constitutes acceptance of the updated terms.
          </p>
        </div>
      </section>
    </main>
  );
}
