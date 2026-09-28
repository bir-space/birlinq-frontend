"use client";

import { MockShell } from "@/components/mock/MockShell";
import { MockBanner } from "@/components/mock/MockBanner";
import { ProfileView } from "@/components/business/ProfileView";

/** Mock counterpart of the account page — phone `77000000000` is taken, password `wrong` never matches. */
export default function Page() {
  return (
    <MockShell authenticated>
      <ProfileView banner={<MockBanner />} />
    </MockShell>
  );
}
