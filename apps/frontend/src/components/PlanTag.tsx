import { GlobalIcons } from "@/assets/icons";

export function ProPlanTag() {
  return (
    <span className="text-sm p-2 flex items-center gap-1 text-warning font-bold">
      <GlobalIcons.ProTagIcon className="size-4" />
      Pro
    </span>
  );
}

export function FreePlanTag() {
  return (
    <span className="text-sm p-2 flex items-center gap-1 text-info font-bold">
      <GlobalIcons.FreeTagIcon className="size-4 mb-1" />
      Free
    </span>
  );
}
