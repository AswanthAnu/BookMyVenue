import { useNavigate } from "react-router-dom";

function VenueCard({ venue }) {
  const navigate = useNavigate();

  const firstImage = venue.images && venue.images.length > 0
    ? venue.images[0]
    : null;

  // This handles both cases:
  // images: ["https://image-url.jpg"]
  // images: [{ url: "https://image-url.jpg" }]
  const imageUrl =
    typeof firstImage === "string" ? firstImage : firstImage?.url;

  function handleCardClick() {
    navigate(`/venues/${venue.id}`);
  }

  return (
    <div
      onClick={handleCardClick}
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
        cursor: "pointer",
        backgroundColor: "white",
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={venue.name}
          style={{
            width: "100%",
            height: "180px",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "180px",
            backgroundColor: "#e5e5e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
          }}
        >
          No Image
        </div>
      )}

      <div style={{ padding: "12px" }}>
        <h3>{venue.name}</h3>

        <p>
          <strong>City:</strong> {venue.city || "Not available"}
        </p>

        <p>
          <strong>Category:</strong> {venue.category_id || "Not available"}
        </p>

        {venue.supports_hourly && (
          <p>
            <strong>Hourly:</strong> ₹{venue.hourly_price}/hr
          </p>
        )}

        {venue.supports_daily && (
          <p>
            <strong>Daily:</strong> ₹{venue.daily_price}/day
          </p>
        )}
      </div>
    </div>
  );
}

export default VenueCard;