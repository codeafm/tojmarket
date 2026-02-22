import React from "react";

export default function Badge({ plan }) {
  if (!plan || plan === "base") return null;

  return (
    <div className="thumbTop">
      {plan === "vip" && <div className="badgePlan vip">VIP</div>}
      {plan === "top" && <div className="badgePlan top">TOP</div>}
    </div>
  );
}
