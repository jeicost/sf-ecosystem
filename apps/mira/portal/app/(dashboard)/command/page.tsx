import { redirect } from 'next/navigation'

// Command duplicated the Approval Queue (same table, same approve/reject
// actions); its alerts section now lives as a tab inside /approvals.
// Kept as a redirect so old links/bookmarks don't 404.
export default function CommandRedirect() {
  redirect('/approvals')
}
