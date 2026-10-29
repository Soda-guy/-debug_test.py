# BillBless Production-Readiness Checklist

This prototype runs in **DEMO MODE**. The items below must be completed, reviewed, and approved before accepting real donations, moving real funds, or exposing uploaded financial documents.

## Legal & Regulatory

- [ ] Corporate entity formation and registered agent
- [ ] Money transmission / payment facilitator licensing review by jurisdiction
- [ ] Charitable solicitation / crowdfunding compliance review
- [ ] Terms of Service, Privacy Policy, and Acceptable Use Policy (counsel-reviewed)
- [ ] GDPR / CCPA / equivalent data-subject request workflows
- [ ] Confirm whether donations are subject to sales tax in each launch market (default assumption: no)
- [ ] Confirm legality of passing card processing fees to donors per jurisdiction (default: do not pass)
- [ ] Consumer disclosures for platform fee ($1 flat)
- [ ] Age restrictions and KYC/AML requirements for recipients and high-volume donors
- [ ] Export / sanctions screening for cross-border assistance
- [ ] Country enablement gated by legal + ops readiness (see `countries.enabled`)

## Payments

- [ ] Payment provider (e.g. Stripe) account approval for this use case
- [ ] Live keys stored only in server secrets — never `NEXT_PUBLIC_*`
- [ ] Webhook signature verification
- [ ] Idempotent charge + refund + chargeback handlers
- [ ] Ledger reconciliation jobs
- [ ] Biller payout workflow with confirmation receipts (`PAID` only after confirmation)
- [ ] Handling of unpayable / closed accounts / overpayments
- [ ] FX / multi-currency settlement strategy with a reliable rate source
- [ ] Disable `is_simulated` flags only after end-to-end certification

## Document Privacy & Verification

- [ ] Private storage buckets with least-privilege policies
- [ ] Malware scanning on upload
- [ ] Non-reversible redaction pipeline (not CSS overlays / PDF black rectangles)
- [ ] Metadata / hidden-text / barcode / QR stripping validated by security review
- [ ] Independent verification of bill authenticity and outstanding balance (not upload-alone)
- [ ] Admin dual-control for accessing original documents
- [ ] Retention and deletion schedules for originals
- [ ] Penetration test of storage path leakage via APIs

## Security

- [ ] Supabase RLS policies applied and regression-tested
- [ ] Service-role key restricted to trusted server environments
- [ ] Rate limiting on auth, upload, and contribution endpoints (Redis/Upstash)
- [ ] WAF / bot protection
- [ ] CSRF protection on mutating routes
- [ ] Content Security Policy
- [ ] Dependency vulnerability scanning in CI
- [ ] Secrets scanning
- [ ] Audit log immutability / export
- [ ] Account deletion fulfills legal erasure requirements

## Product / Ops

- [ ] Human verification staffing and SLAs
- [ ] Fraud / duplicate submission detection
- [ ] Customer support tooling for disputes
- [ ] Monitoring, alerting, and on-call
- [ ] Localization for launch languages
- [ ] Accessibility audit (WCAG) including reduced-motion
- [ ] Load testing of contribution concurrency controls

## Explicitly Incomplete in This Prototype

| Area | Status |
|------|--------|
| Real payment charging | Simulated only |
| Supabase live auth/storage | Schema ready; local demo auth used when unset |
| Automatic redaction ML pipeline | Manual/sanitized synthetic statements |
| Independent bill verification | Admin approve/reject of synthetic docs |
| Real document upload persistence | Client-side staging only in demo |
| International FX conversion | Not performed |
| Production rate limiting | In-memory demo limiter |

**Do not claim automatic redaction or verification is fully secure without testing and review.**
