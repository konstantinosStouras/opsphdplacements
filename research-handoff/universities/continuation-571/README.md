# Stage 1 publication repair — 26 October 2026

The continuation570 research cut passed working-directory checks, but release350aa6f omitted regenerated data/entities.json from its explicit file list. GitHub run40302672013 failed its record-stamp validator: USTC's derived programme status remained unknown in the committed organisation record while the committed stamp ledger reflected active. No failed deployment replaced the previous live release f369913.

This repair includes exactly the already validated USTC organisation status/statusAsOf and its generated updatedAt. No new research finding, source or programme is introduced. Public count remains 404 current qualifying programmes at 302 institutions; 268 grouped incomplete Stage 1 identities remain. Stages 2–4 and automation stay held.

Before publication, compare the frozen release paths with all modified public data and reject omissions. Working-directory checks alone cannot prove the committed cut is complete. Stage only reviewed changes; never sweep another contributor's pending changes into a release. WORKFLOW.md and TODO.md record this pitfall.

Verification: the corrected organisation record matches its source programme and generated ledger. All changed public data are staged; record-date and dataset validators pass. Deployment and live verification follow this commit.
