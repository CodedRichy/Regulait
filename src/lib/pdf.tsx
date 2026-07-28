import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ComplianceReport } from "@/lib/report-generator";
import type { RiskTier } from "@/lib/knowledge-base";

// Server-side only: @react-pdf/renderer's renderToBuffer relies on Node
// streams/fontkit and must never be imported into a client bundle. This
// module is only ever imported from route handlers (see src/app/api/pdf).

const eurFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

interface TierMeta {
  pillLabel: string;
  heading: string;
  description: string;
  accent: string;
  bg: string;
  pillText: string;
}

const TIER_META: Record<RiskTier, TierMeta> = {
  unacceptable: {
    pillLabel: "UNACCEPTABLE RISK",
    heading: "Prohibited under the EU AI Act",
    description:
      "This system falls into a banned category (Article 5). It cannot be placed on the EU market, deployed, or put into service in any form.",
    accent: "#b3261e",
    bg: "#fbeceb",
    pillText: "#ffffff",
  },
  high: {
    pillLabel: "HIGH RISK",
    heading: "Strict obligations apply before market entry",
    description:
      "This system is high-risk under Annex III. It must satisfy risk management, data governance, documentation, oversight, and registration requirements before deployment.",
    accent: "#9a5b13",
    bg: "#fbf1e4",
    pillText: "#ffffff",
  },
  limited: {
    pillLabel: "LIMITED RISK",
    heading: "Transparency obligations apply",
    description:
      "This system must disclose that people are interacting with AI, and label any synthetic content it generates. No conformity assessment is required.",
    accent: "#8a6d10",
    bg: "#faf3d9",
    pillText: "#4a3c08",
  },
  minimal: {
    pillLabel: "MINIMAL RISK",
    heading: "No mandatory obligations",
    description:
      "This system falls outside the Act's regulated categories. Voluntary codes of conduct are encouraged, but no specific legal requirements apply.",
    accent: "#1f7a52",
    bg: "#e9f6ef",
    pillText: "#ffffff",
  },
};

const EFFORT_META: Record<
  "low" | "medium" | "high",
  { label: string; bg: string; text: string }
> = {
  low: { label: "LOW EFFORT", bg: "#e9f6ef", text: "#1f7a52" },
  medium: { label: "MEDIUM EFFORT", bg: "#faf3d9", text: "#4a3c08" },
  high: { label: "HIGH EFFORT", bg: "#fbeceb", text: "#b3261e" },
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1c2434",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  brandSub: {
    marginTop: 2,
    fontSize: 8,
    color: "#5b6472",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaBlock: {
    alignItems: "flex-end",
  },
  metaText: {
    fontSize: 8,
    color: "#5b6472",
  },
  divider: {
    marginTop: 12,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#d8dbe0",
  },
  sectionEyebrow: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#5b6472",
    marginBottom: 3,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#d8dbe0",
    paddingBottom: 6,
  },
  section: {
    marginTop: 20,
  },
  tierBox: {
    borderLeftWidth: 3,
    padding: 14,
  },
  tierPillRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tierPill: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tierConfidence: {
    marginLeft: 8,
    fontSize: 8,
    color: "#5b6472",
  },
  tierHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    marginBottom: 4,
  },
  tierDesc: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#3a4250",
  },
  paragraph: {
    fontSize: 9.5,
    lineHeight: 1.6,
    color: "#1c2434",
  },
  reqBox: {
    borderWidth: 1,
    borderColor: "#d8dbe0",
    padding: 10,
    marginBottom: 8,
  },
  reqHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  reqArticle: {
    fontSize: 7.5,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#5b6472",
  },
  reqTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    marginTop: 1,
  },
  effortBadge: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    letterSpacing: 0.5,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 7,
  },
  reqSummary: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#3a4250",
    marginBottom: 6,
  },
  reqActionRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  reqBullet: {
    width: 8,
    fontSize: 9,
    color: "#5b6472",
  },
  reqActionText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 1.4,
  },
  reqDeadlineRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#d8dbe0",
    flexDirection: "row",
  },
  reqDeadlineLabel: {
    fontSize: 7.5,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#5b6472",
    marginRight: 6,
  },
  reqDeadlineValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
  },
  penaltyBox: {
    borderLeftWidth: 3,
    borderLeftColor: "#b3261e",
    backgroundColor: "#fbeceb",
    padding: 14,
  },
  penaltyDesc: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
  },
  penaltyFine: {
    marginTop: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: "#b3261e",
  },
  penaltyPercent: {
    marginTop: 2,
    fontSize: 9,
    color: "#5b6472",
  },
  penaltyBasis: {
    marginTop: 8,
    fontSize: 8,
    lineHeight: 1.5,
    color: "#5b6472",
  },
  exemptionSubheading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
  exemptionBoxApplicable: {
    borderLeftWidth: 3,
    borderLeftColor: "#1f7a52",
    backgroundColor: "#e9f6ef",
    padding: 8,
    marginBottom: 6,
  },
  exemptionBoxNotApplicable: {
    borderWidth: 1,
    borderColor: "#d8dbe0",
    padding: 8,
    marginBottom: 6,
  },
  exemptionName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  exemptionDesc: {
    marginTop: 2,
    fontSize: 8,
    lineHeight: 1.4,
    color: "#5b6472",
  },
  exemptionMeta: {
    marginTop: 3,
    fontSize: 8,
    lineHeight: 1.4,
  },
  obligationBox: {
    borderWidth: 1,
    borderColor: "#d8dbe0",
    padding: 10,
    marginBottom: 8,
  },
  obligationTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  obligationDesc: {
    marginTop: 3,
    fontSize: 8.5,
    lineHeight: 1.5,
    color: "#3a4250",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#d8dbe0",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    lineHeight: 1.5,
    color: "#5b6472",
  },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    right: 40,
    fontSize: 7,
    color: "#5b6472",
  },
});

function ReportDocument({ report }: { report: ComplianceReport }) {
  const tier = TIER_META[report.risk_tier];
  const createdAt = new Date(report.created_at);
  const hasValidDate = !Number.isNaN(createdAt.getTime());
  const sortedRequirements = report.requirements
    .slice()
    .sort((a, b) => a.number - b.number);

  return (
    <Document
      title={`Regulait Compliance Report ${report.id}`}
      author="Regulait"
      subject="EU AI Act Compliance Report"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>REGULAIT</Text>
            <Text style={styles.brandSub}>
              EU AI Act &middot; Compliance Report
            </Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaText}>{report.id}</Text>
            {hasValidDate && (
              <Text style={styles.metaText}>
                Generated {dateFormatter.format(createdAt)}
              </Text>
            )}
            <Text style={styles.metaText}>
              {report.source === "llm" ? "AI-assisted" : "Rules-based"}{" "}
              classification
            </Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Risk tier */}
        <View
          style={[
            styles.tierBox,
            { backgroundColor: tier.bg, borderLeftColor: tier.accent },
          ]}
        >
          <View style={styles.tierPillRow}>
            <Text
              style={[
                styles.tierPill,
                { backgroundColor: tier.accent, color: tier.pillText },
              ]}
            >
              {tier.pillLabel}
            </Text>
            <Text style={styles.tierConfidence}>
              {Math.round(report.confidence * 100)}% confidence
            </Text>
          </View>
          <Text style={[styles.tierHeading, { color: tier.accent }]}>
            {tier.heading}
          </Text>
          <Text style={styles.tierDesc}>{tier.description}</Text>
        </View>

        {/* Reasoning */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Assessment</Text>
          <Text style={styles.sectionTitle}>Why this classification</Text>
          <Text style={styles.paragraph}>{report.reasoning}</Text>
        </View>

        {/* Requirements */}
        {sortedRequirements.length > 0 && (
          <View style={styles.section} break>
            <Text style={styles.sectionEyebrow}>
              {sortedRequirements.length} requirement
              {sortedRequirements.length === 1 ? "" : "s"}
            </Text>
            <Text style={styles.sectionTitle}>Compliance Requirements</Text>
            {sortedRequirements.map((requirement) => {
              const effort = EFFORT_META[requirement.effort];
              return (
                <View key={requirement.number} style={styles.reqBox} wrap={false}>
                  <View style={styles.reqHeaderRow}>
                    <View>
                      <Text style={styles.reqArticle}>
                        Article {requirement.number}
                      </Text>
                      <Text style={styles.reqTitle}>{requirement.title}</Text>
                    </View>
                    <Text
                      style={[
                        styles.effortBadge,
                        { backgroundColor: effort.bg, color: effort.text },
                      ]}
                    >
                      {effort.label}
                    </Text>
                  </View>
                  <Text style={styles.reqSummary}>{requirement.summary}</Text>
                  {requirement.key_actions.map((action, index) => (
                    <View key={`${requirement.number}-${index}`} style={styles.reqActionRow}>
                      <Text style={styles.reqBullet}>&middot;</Text>
                      <Text style={styles.reqActionText}>{action}</Text>
                    </View>
                  ))}
                  <View style={styles.reqDeadlineRow}>
                    <Text style={styles.reqDeadlineLabel}>Deadline</Text>
                    <Text style={styles.reqDeadlineValue}>
                      {requirement.deadline}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Transparency obligations */}
        {report.transparency_obligations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>Article 50 / 52</Text>
            <Text style={styles.sectionTitle}>Transparency Obligations</Text>
            {report.transparency_obligations.map((obligation) => (
              <View key={obligation.id} style={styles.obligationBox} wrap={false}>
                <Text style={styles.obligationTitle}>{obligation.title}</Text>
                <Text style={styles.obligationDesc}>
                  {obligation.description}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Penalties */}
        {report.penalties && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionEyebrow}>Enforcement</Text>
            <Text style={styles.sectionTitle}>
              Penalties for Non-Compliance
            </Text>
            <View style={styles.penaltyBox}>
              <Text style={styles.penaltyDesc}>
                {report.penalties.description}
              </Text>
              <Text style={styles.penaltyFine}>
                Up to {eurFormatter.format(report.penalties.max_fine_eur)}
              </Text>
              <Text style={styles.penaltyPercent}>
                or {report.penalties.max_fine_percent}% of total worldwide
                annual turnover
              </Text>
              <Text style={styles.penaltyBasis}>
                {report.penalties.fine_basis}
              </Text>
            </View>
          </View>
        )}

        {/* Exemptions */}
        {(report.exemptions.applicable.length > 0 ||
          report.exemptions.not_applicable.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>Carve-outs</Text>
            <Text style={styles.sectionTitle}>Exemptions</Text>
            <Text style={styles.exemptionSubheading}>
              Applicable ({report.exemptions.applicable.length})
            </Text>
            {report.exemptions.applicable.length === 0 && (
              <Text style={styles.exemptionDesc}>
                No exemptions apply to this system.
              </Text>
            )}
            {report.exemptions.applicable.map((exemption) => (
              <View
                key={exemption.name}
                style={styles.exemptionBoxApplicable}
                wrap={false}
              >
                <Text style={styles.exemptionName}>{exemption.name}</Text>
                <Text style={styles.exemptionDesc}>
                  {exemption.description}
                </Text>
                <Text style={styles.exemptionMeta}>
                  Effect: {exemption.effect}
                </Text>
                <Text style={styles.exemptionMeta}>
                  Criteria: {exemption.criteria}
                </Text>
              </View>
            ))}
            <Text style={styles.exemptionSubheading}>
              Not applicable ({report.exemptions.not_applicable.length})
            </Text>
            {report.exemptions.not_applicable.map((exemption) => (
              <View
                key={exemption.name}
                style={styles.exemptionBoxNotApplicable}
                wrap={false}
              >
                <Text style={styles.exemptionName}>{exemption.name}</Text>
                <Text style={styles.exemptionDesc}>
                  {exemption.description}
                </Text>
                <Text style={styles.exemptionMeta}>
                  Criteria: {exemption.criteria}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Legal disclaimer footer, repeated on every page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Disclaimer. This report is generated automatically from
            self-reported information and reflects Regulait&apos;s
            interpretation of the EU AI Act at the time of generation. It
            does not constitute legal advice and should not be relied upon
            as a substitute for consultation with a qualified legal
            professional. Regulait makes no warranty as to the accuracy or
            completeness of this report and accepts no liability for
            decisions made on the basis of it.
          </Text>
        </View>
        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export async function generateReportPDF(
  report: ComplianceReport
): Promise<Blob> {
  const buffer = await renderToBuffer(<ReportDocument report={report} />);
  return new Blob([new Uint8Array(buffer)], { type: "application/pdf" });
}
