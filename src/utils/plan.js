export function planRank(plan) {
  if (plan === "top") return 2;
  if (plan === "vip") return 1;
  return 0; // base
}

export function planLabel(plan) {
  if (plan === "top") return "TOP";
  if (plan === "vip") return "VIP";
  return "";
}
