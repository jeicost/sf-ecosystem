import React from 'react'

// No guard here on purpose: /operations (My Team — support, FAQ, tutorials)
// is a normal client-facing department page. The internal-agency sub-pages
// (billing, system, users) carry their own super_admin guard in their own
// layouts. A previous blanket guard here bounced every real client who
// clicked the Operations icon straight back to /home.
export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>
}
