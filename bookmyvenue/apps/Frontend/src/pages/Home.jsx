import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getCategories } from "../api/categories";
import { getVenues, getHomepageData } from "../api/venues";

function Home() {
  const navigate = useNavigate();
  const { token, currentUser, logout, loading } = useAuth();

  const [searchText, setSearchText] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [availabilityType, setAvailabilityType] = useState("");

  const [isSearchActive, setIsSearchActive] = useState(false);

  const [categories, setCategories] = useState([]);

  const [venues, setVenues] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [topRatedVenues, setTopRatedVenues] = useState([]);
  const [recentlyAddedVenues, setRecentlyAddedVenues] = useState([]);
  const [categorySections, setCategorySections] = useState([]);
  const [homepageLoading, setHomepageLoading] = useState(true);
  const [homepageError, setHomepageError] = useState("");

  const isLoggedIn = token && currentUser;
  const limit = 16;

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.log(err);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    async function loadHomepageData() {
      try {
        const data = await getHomepageData();

        setTopRatedVenues(data.top_rated || []);
        setRecentlyAddedVenues(data.recently_added || []);
        setCategorySections(data.by_category || []);
      } catch (err) {
        setHomepageError("Failed to load homepage data");
      } finally {
        setHomepageLoading(false);
      }
    }

    loadHomepageData();
  }, []);

  useEffect(() => {
    const allInputsCleared =
      searchText.trim() === "" &&
      city.trim() === "" &&
      categoryId === "" &&
      availabilityType === "";

    if (allInputsCleared) {
      setIsSearchActive(false);
      setVenues([]);
      setTotal(0);
      setCurrentPage(1);
    }
  }, [searchText, city, categoryId, availabilityType]);

  function goToDashboard() {
    if (currentUser.role === "booker") {
      navigate("/dashboard");
    } else if (currentUser.role === "owner") {
      navigate("/owner/dashboard");
    } else if (currentUser.role === "admin") {
      navigate("/admin/dashboard");
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  function buildSearchParams(pageNumber) {
    const params = {
      page: pageNumber,
      limit: limit,
    };

    if (searchText.trim()) {
      params.search = searchText.trim();
    }

    if (city.trim()) {
      params.city = city.trim();
    }

    if (categoryId) {
      params.category_id = categoryId;
    }

    if (availabilityType) {
      params.availability_type = availabilityType;
    }

    return params;
  }

  function extractVenuesFromResponse(data) {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.venues)) {
      return data.venues;
    }

    if (Array.isArray(data.items)) {
      return data.items;
    }

    return [];
  }

  function extractTotalFromResponse(data) {
    if (typeof data.total === "number") {
      return data.total;
    }

    if (typeof data.count === "number") {
      return data.count;
    }

    if (Array.isArray(data)) {
      return data.length;
    }

    return 0;
  }

  async function fetchSearchResults(pageNumber) {
    try {
      setSearchLoading(true);
      setSearchError("");

      const params = buildSearchParams(pageNumber);
      const data = await getVenues(params);

      const venueList = extractVenuesFromResponse(data);
      const totalCount = extractTotalFromResponse(data);

      setVenues(venueList);
      setTotal(totalCount);
      setCurrentPage(pageNumber);
    } catch (err) {
      setSearchError("Failed to fetch venues");
    } finally {
      setSearchLoading(false);
    }
  }

  function handleSearch() {
    const hasSearchValue =
      searchText.trim() !== "" ||
      city.trim() !== "" ||
      categoryId !== "" ||
      availabilityType !== "";

    if (!hasSearchValue) {
      setIsSearchActive(false);
      return;
    }

    setIsSearchActive(true);
    fetchSearchResults(1);
  }

  async function handlePageClick(pageNumber) {
    fetchSearchResults(pageNumber);
  }

  async function handleLoadMore(sectionName) {
    try {
      const data = await getVenues({
        page: 1,
        limit: 8,
      });

      const newVenues = extractVenuesFromResponse(data);

      if (sectionName === "topRated") {
        setTopRatedVenues((previousVenues) => [
          ...previousVenues,
          ...newVenues,
        ]);
      }

      if (sectionName === "recentlyAdded") {
        setRecentlyAddedVenues((previousVenues) => [
          ...previousVenues,
          ...newVenues,
        ]);
      }
    } catch (err) {
      alert("Failed to load more venues");
    }
  }

  function VenueCard({ venue }) {
    return (
      <div
        style={{
          border: "1px solid #ddd",
          padding: "16px",
          borderRadius: "8px",
          backgroundColor: "white",
        }}
      >
        <h3>{venue.name}</h3>

        <p>
          <strong>City:</strong> {venue.city || "Not available"}
        </p>

        {venue.status && (
          <p>
            <strong>Status:</strong> {venue.status}
          </p>
        )}

        {venue.supports_hourly && (
          <p>
            <strong>Hourly:</strong> ₹{venue.hourly_price}
          </p>
        )}

        {venue.supports_daily && (
          <p>
            <strong>Daily:</strong> ₹{venue.daily_price}
          </p>
        )}

        <button onClick={() => navigate(`/venues/${venue.id}`)}>
          View Details
        </button>
      </div>
    );
  }

  function VenueGrid({ venueList }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        marginTop: "16px",
      }}
    >
      {venueList.map((venue, index) => {
        const venueKey = venue.id || venue.venue_id || index;

        return (
          <VenueCard
            key={venueKey}
            venue={venue}
          />
        );
      })}
    </div>
  );
}

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Section 1 - Header */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          backgroundColor: "white",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 24px",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          BookMyVenue
        </div>

        <div>
          {loading ? (
            <span>Loading...</span>
          ) : isLoggedIn ? (
            <>
              <button onClick={goToDashboard}>Dashboard</button>

              <button
                onClick={handleLogout}
                style={{ marginLeft: "10px" }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/login")}>Login</button>

              <button
                onClick={() => navigate("/register")}
                style={{ marginLeft: "10px" }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      <main
        style={{
          paddingTop: "80px",
          paddingLeft: "24px",
          paddingRight: "24px",
          paddingBottom: "40px",
        }}
      >
        {/* Section 3 - Hero Banner */}
        {!isSearchActive && (
          <section
            style={{
              background:
                "linear-gradient(135deg, #1d4ed8, #7c3aed)",
              color: "white",
              padding: "60px 30px",
              borderRadius: "12px",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            <h1>
              Find and book the perfect venue for your next event
            </h1>

            <p>
              Discover auditoriums, banquet halls, conference rooms and more
            </p>
          </section>
        )}

        {/* Section 2 - Search Bar */}
        <section
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "30px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Search venues..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />

          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />

          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">All Categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={availabilityType}
            onChange={(event) => setAvailabilityType(event.target.value)}
          >
            <option value="">Any Availability</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="both">Both</option>
          </select>

          <button onClick={handleSearch}>Search</button>
        </section>

        {/* Section 4 - Search Results */}
        {isSearchActive && (
          <section>
            <h2>Search Results</h2>

            {searchLoading && <p>Loading venues...</p>}

            {searchError && (
              <p style={{ color: "red" }}>{searchError}</p>
            )}

            {!searchLoading && !searchError && venues.length === 0 && (
              <p>No venues found matching your search</p>
            )}

            {!searchLoading && venues.length > 0 && (
              <>
                <VenueGrid venueList={venues} />

                {totalPages > 1 && (
                  <div style={{ marginTop: "24px" }}>
                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    ).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageClick(pageNumber)}
                        style={{
                          marginRight: "8px",
                          fontWeight:
                            currentPage === pageNumber
                              ? "bold"
                              : "normal",
                        }}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Section 5 - Curated Sections */}
        {!isSearchActive && (
          <section>
            {homepageLoading && <p>Loading homepage venues...</p>}

            {homepageError && (
              <p style={{ color: "red" }}>{homepageError}</p>
            )}

            {!homepageLoading && !homepageError && (
              <>
                <section style={{ marginBottom: "40px" }}>
                  <h2>Top Rated Venues</h2>

                  <VenueGrid venueList={topRatedVenues.slice(0, 4)} />

                  <button
                    onClick={() => handleLoadMore("topRated")}
                    style={{ marginTop: "16px" }}
                  >
                    Load More
                  </button>
                </section>

                <section style={{ marginBottom: "40px" }}>
                  <h2>Recently Added</h2>

                  <VenueGrid venueList={recentlyAddedVenues.slice(0, 4)} />

                  <button
                    onClick={() => handleLoadMore("recentlyAdded")}
                    style={{ marginTop: "16px" }}
                  >
                    Load More
                  </button>
                </section>

                {categorySections.map((section) => {
                  if (!section.venues || section.venues.length === 0) {
                    return null;
                  }

                  return (
                    <section
                      key={section.category_id || section.category_name}
                      style={{ marginBottom: "40px" }}
                    >
                      <h2>{section.category_name}</h2>

                      <VenueGrid venueList={section.venues.slice(0, 4)} />
                    </section>
                  );
                })}
              </>
            )}
          </section>
        )}
      </main>
      <footer
            style={{
                borderTop: "1px solid #ddd",
                padding: "20px",
                textAlign: "center",
                marginTop: "40px",
                color: "#555",
            }}
            >
            © 2026 BookMyVenue. All rights reserved.
      </footer>
    </div>
  );
}

export default Home;