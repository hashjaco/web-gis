export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <section className="space-y-6 text-sm leading-relaxed text-foreground/80">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">1. Data We Collect</h2>
          <p>
            We collect account information (name, email) via our authentication provider,
            geospatial data you upload or create within projects, and standard web analytics
            (page views, error logs). We do not sell your data to third parties.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">2. How We Use Your Data</h2>
          <p>
            Your data is used to provide the GIS mapping service, authenticate your account,
            enforce plan limits, and improve service reliability. Geospatial data you create
            belongs to you and is stored in your projects.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">3. Data Storage and Security</h2>
          <p>
            All data is encrypted in transit (TLS 1.2+) and at rest. We use
            industry-standard security practices including authentication via Clerk,
            audit logging, and role-based access controls. Geospatial data is stored in
            PostgreSQL with PostGIS and is isolated per project.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">4. Subprocessors</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li><strong>Clerk</strong> — Authentication and user management</li>
            <li><strong>PostgreSQL hosting provider</strong> — Database storage</li>
            <li><strong>MapTiler</strong> — Basemap tile serving</li>
            <li><strong>Nominatim (OpenStreetMap)</strong> — Geocoding services</li>
            <li><strong>OSRM</strong> — Routing engine</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">5. Your Rights</h2>
          <p>
            You have the right to access, export, and delete your data at any time.
            Use <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/api/user/data</code> (GET
            to export, DELETE to erase) or contact us. Upon account deletion, all associated
            projects, layers, and features are permanently removed.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">6. Data Retention</h2>
          <p>
            Active account data is retained for the duration of your subscription.
            Audit logs are retained for 12 months. Upon account deletion, all personal
            data is removed within 30 days.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">7. Geolocation Data</h2>
          <p>
            Geospatial data (coordinates, geometries, layers) you create is treated as
            sensitive information. Access is restricted to project owners and authorized
            users. Public projects expose data only as explicitly configured by the owner.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">8. Contact</h2>
          <p>
            For privacy inquiries, data requests, or to report a security concern,
            contact us at <strong>privacy@example.com</strong>.
          </p>
        </div>
      </section>
    </main>
  );
}
