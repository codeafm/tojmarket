import React from "react";
import { Link } from "react-router-dom";
import Badge from "./Badge.jsx";

export default function ListingCard({ item }) {
  const img = item?.photos?.[0] || null;
  const title = item?.title || "—";

  return (
    <Link to={`/listing/${item.id}`} className="listingCard">
      <div className="thumb">
        <Badge plan={item.plan} />
        {img ? (
          <img src={img} alt={title} loading="lazy" />
        ) : (
          <div className="thumbPh">Фото</div>
        )}
      </div>

      <div className="cardBody">
        <div className="line1">
          <div className="title">{title}</div>
          <div className="badge">{item.category || "—"}</div>
        </div>

        <div className="meta">
          {item.city || "—"} • {item.createdLabel || "сейчас"}
        </div>

        <div className="priceRow">
          <div className="price">{formatPrice(item.price)} TJS</div>
          <div className="views">👁 {item?.stats?.views ?? 0}</div>
        </div>
      </div>
    </Link>
  );
}

function formatPrice(v) {
  if (v === undefined || v === null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("ru-RU");
}