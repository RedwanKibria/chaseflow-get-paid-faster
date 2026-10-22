# Architecture rules
- Welcome emails authenticate with an anon-key client's `auth.getUser` and derive the recipient from that user, never from request input, to prevent arbitrary-recipient sends.
- Immediate invoice send limits use existing activity logs for rolling per-user and per-invoice counts; no additional persistence is needed for this safeguard.
- Invoice branding is stored as an owned private-storage path on the profile and copied to new invoices so later profile changes do not rewrite existing invoice branding.