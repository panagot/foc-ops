# Backup proposal (if Lifecycle Ops is declined)

**Only open this as a new GitHub issue after a decline or clear “not a fit” on foc-ops.**  
Do not amend a rejected Next Step issue into this — submit fresh.

## Pitch

**Terraform provider for Filecoin Onchain Cloud** (`terraform-provider-foc`)

Declare FOC storage/payment state as IaC:

- USDFC deposit / operator approval targets  
- Runway alert thresholds (wires to `foc-ops` metrics if that code exists)  
- Warm data-set + optional cold-archive policy resources  

## Why separate

Lifecycle Ops = observe + act.  
Terraform = declare desired state for infra teams. Different buyer, different review.

## Suggested ask

Open Grant **$20–30k** (or Next Step only if scoped to a thin provider wrapping a finished `foc-ops` API).

## One-liner for reviewers

> If Lifecycle Ops isn’t funded, the follow-on we would propose is a Terraform provider so teams can `terraform apply` Filecoin Onchain Cloud payments and tier policy the same way they manage AWS/GCP storage.
