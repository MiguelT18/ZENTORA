"use client";

import { SubscriptionProvider } from "@/components/Pricing/subscriptionContext";
import PlansPageContent from "@/components/Pricing/PlansPageContent";

export default function PlansPage() {
  return (
    <SubscriptionProvider>
      <PlansPageContent />
    </SubscriptionProvider>
  );
}
