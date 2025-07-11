"use client";

import { SubscriptionProvider } from "@/components/pricing/subscriptionContext";
import PlansPageContent from "@/components/pricing/PlansPageContent";

export default function PlansPage() {
  return (
    <SubscriptionProvider>
      <PlansPageContent />
    </SubscriptionProvider>
  );
}
