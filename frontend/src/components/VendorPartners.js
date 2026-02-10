import { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Filter,
  X,
  Tag,
  Percent,
  FileText,
  Store,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOcardStyles,
  EOradius,
  EOtransitions,
} from "../styles/EOdesignSystem";

export default function VendorPartners({ layout = "list" }) {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters
  useEffect(() => {
    let filtered = vendors;

    if (searchFilter) {
      filtered = filtered.filter(
        (vendor) =>
          vendor.companyName
            ?.toLowerCase()
            .includes(searchFilter.toLowerCase()) ||
          vendor.description
            ?.toLowerCase()
            .includes(searchFilter.toLowerCase()) ||
          vendor.category
            ?.toLowerCase()
            .includes(searchFilter.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(
        (vendor) => vendor.category === categoryFilter
      );
    }

    setFilteredVendors(filtered);
  }, [vendors, searchFilter, categoryFilter]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      console.log("Fetching vendors from database...");
      const { data } = await axios.get(
        "http://localhost:5001/api/vendors/loyalty/vendors"
      );

      if (data && data.length > 0) {
        console.log("Vendors fetched successfully:", data.length);
        const processedVendors = data.map((vendor) => ({
          _id: vendor._id,
          companyName: vendor.companyName || "Unnamed Vendor",
          email: vendor.email,
          category: vendor.category || "General",
          description: vendor.description || "No description available",
          discountRate: vendor.discountRate || vendor.discount || 0,
          promoCode: vendor.promoCode || "N/A",
          terms:
            vendor.terms ||
            vendor.termsAndConditions ||
            "No specific terms",
          contactPhone: vendor.phone || vendor.contactPhone || "Not provided",
          location: vendor.location || "Not specified",
          isActive: vendor.isActive !== false,
        }));
        setVendors(processedVendors);
      } else {
        console.log("No vendors found in database");
        setVendors([]);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const clearFilters = () => {
    setSearchFilter("");
    setCategoryFilter("");
  };

  const hasActiveFilters = searchFilter || categoryFilter;
  const vendorCategories = [
    ...new Set(
      vendors.map((vendor) => vendor.category).filter(Boolean)
    ),
  ];

  // Render loading state based on layout
  const renderLoadingState = () => {
    if (layout === "grid") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div 
              key={item} 
              className="bg-white rounded-2xl shadow-md border border-[#EAECF0] p-6 animate-pulse"
              style={{
                border: `2px solid ${EOcolors.lightSilver}`,
                borderRadius: EOradius.lg,
              }}
            >
              <div className="space-y-3">
                <div className="bg-gray-300 rounded h-6 w-3/4 mx-auto"></div>
                <div className="bg-gray-300 rounded h-4 w-full"></div>
                <div className="bg-gray-300 rounded h-4 w-1/2 mx-auto"></div>
                <div className="bg-gray-300 rounded h-20 w-full"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // List layout loading
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="vendor-partner-card bg-white rounded-2xl shadow-md border border-[#EAECF0] p-6"
            style={{
              border: `2px solid ${EOcolors.lightSilver}`,
              borderRadius: EOradius.lg,
            }}
          >
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] rounded-xl p-4 text-center min-w-[120px] h-20 animate-pulse">
                <div className="bg-gray-300 rounded h-4 w-16 mx-auto mb-2"></div>
                <div className="bg-gray-300 rounded h-8 w-12 mx-auto"></div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="bg-gray-300 rounded h-6 w-48"></div>
                <div className="bg-gray-300 rounded h-4 w-full"></div>
                <div className="bg-gray-300 rounded h-4 w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render empty state based on layout
  const renderEmptyState = () => (
    <div 
      className="bg-white rounded-2xl shadow-lg p-8 border border-[#EAECF0] text-center"
      style={{
        border: `2px solid ${EOcolors.lightSilver}`,
        borderRadius: EOradius.lg,
      }}
    >
      <Store className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-[#1F2937] mb-2">
        {hasActiveFilters && vendors.length > 0
          ? "No vendors match your filters"
          : vendors.length === 0
          ? "No Vendor Partners Available"
          : "No Vendors Found"}
      </h3>
      <p className="text-[#6B7280] text-sm mb-4">
        {hasActiveFilters && vendors.length > 0
          ? "Try adjusting your search criteria or clear filters to see all vendors."
          : vendors.length === 0
          ? "There are currently no vendor partners in the loyalty program."
          : "No vendors match the current criteria."}
      </p>
      {hasActiveFilters && (
        <Button
          onClick={clearFilters}
          variant="outline"
          className="border-[#2B4B3E] text-[#2B4B3E] hover:bg-[#2B4B3E] hover:text-white"
        >
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  // Render header section (common for both layouts)
  const renderHeader = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "1rem",
        flexWrap: "wrap",
        marginBottom: showFilters && vendors.length > 0 ? "0" : "1.5rem",
      }}
    >
      
      <div>
        <CardTitle
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: EOcolors.secondary,
            marginBottom: "0.5rem",
          }}
        >
          Vendor Partners
        </CardTitle>
        <p
          style={{
            color: EOcolors.text.secondary,
            fontSize: "0.9375rem",
          }}
        >
          GUC Loyalty Program Partners with exclusive discounts
          {hasActiveFilters && vendors.length > 0 &&
            ` (${filteredVendors.length} of ${vendors.length} vendors)`}
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          disabled={vendors.length === 0}
          style={{
            ...EObuttonStyles.outline,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 0.9rem",
            fontSize: "0.875rem",
          }}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>
    </div>
  );

  // Render filters section (common for both layouts)
  const renderFilters = () => (
    showFilters && vendors.length > 0 && (
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1.5rem",
          background: "#F9FAFB",
          borderRadius: EOradius.lg,
          border: `2px solid ${EOcolors.lightSilver}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#2B4B3E",
            }}
          >
            Filter Vendors
          </h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  ...EObuttonStyles.outline,
                  borderColor: "#FCA5A5",
                  color: "#B91C1C",
                  padding: "0.35rem 0.7rem",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <X className="w-3 h-3" />
                Clear Filters
              </button>
            )}
            <button
              onClick={() => setShowFilters(false)}
              style={{
                ...EObuttonStyles.outline,
                padding: "0.35rem 0.7rem",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <X className="w-3 h-3" />
              Close
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "1rem",
          }}
        >
          {/* Search */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#344054",
                marginBottom: "0.4rem",
              }}
            >
              Search Vendors
            </label>
            <div style={{ position: "relative" }}>
              <Search className="w-4 h-4"
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#667085",
                }}
              />
              <Input
                type="text"
                placeholder="Search by company name or description..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10 border-[#D0D5DD]"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#344054",
                marginBottom: "0.4rem",
              }}
            >
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-[#D0D5DD] rounded-lg px-3 py-2 text-sm focus:border-[#D7DBF2] focus:ring-2 focus:ring-[#D7DBF2] bg-white text-[#344054]"
            >
              <option value="">All Categories</option>
              {vendorCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div
            style={{
              marginTop: "0.75rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            {searchFilter && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#D7DBF2] text-[#2D3748] text-sm">
                Search: {searchFilter}
                <button
                  onClick={() => setSearchFilter("")}
                  className="ml-2 text-[#2D3748] hover:text-[#475467]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {categoryFilter && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E5E9D5] text-[#2D3748] text-sm">
                Category: {categoryFilter}
                <button
                  onClick={() => setCategoryFilter("")}
                  className="ml-2 text-[#2D3748] hover:text-[#475467]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    )
  );

  // Render vendor cards in grid layout
  const renderGridLayout = () => (
    <Card
      style={{
        ...EOcardStyles.base,
        border: `2px solid ${EOcolors.lightSilver}`,
      }}
    >
      <CardHeader
        style={{
          paddingBottom: "1.5rem",
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        {renderHeader()}
        {renderFilters()}
      </CardHeader>

      <CardContent style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0 }}>
        {loading ? (
          renderLoadingState()
        ) : filteredVendors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor._id}
                className="vendor-partner-card bg-white rounded-2xl shadow-md border border-[#EAECF0] p-6 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                style={{
                  border: `2px solid ${EOcolors.lightSilver}`,
                  borderRadius: EOradius.lg,
                }}
              >
                {/* Discount Badge */}
                <div className="text-center mb-4">
                  <div className="text-[11px] font-semibold tracking-[0.12em] text-[#64748B] mb-1">
                    VENDOR PARTNER
                  </div>
                  <div className="text-2xl font-extrabold text-[#111827] mb-2">
                    {vendor.discountRate > 0 ? `${vendor.discountRate}%` : "N/A"} OFF
                  </div>
                </div>
                
                {/* Company Name */}
                <h3 className="text-lg font-extrabold text-[#083344] mb-2 text-center line-clamp-2">
                  {vendor.companyName}
                </h3>
                
                {/* Category and Status */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-[#64748B] bg-[#F8FAFC] px-2 py-1 rounded">
                    {vendor.category}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                    vendor.isActive
                      ? "border-[#16A34A] text-[#16A34A] bg-[#ECFDF3]"
                      : "border-[#9CA3AF] text-[#4B5563] bg-[#F3F4F6]"
                  }`}>
                    {vendor.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                
                {/* Description */}
                <p className="text-[#6B7280] text-sm mb-4 line-clamp-3 flex-grow">
                  {vendor.description}
                </p>
                
                {/* Promo Code */}
                {vendor.promoCode && vendor.promoCode !== "N/A" && (
                  <div className="text-center mb-3">
                    <span className="text-xs text-[#6B7280] block mb-1">Use Promo Code:</span>
                    <code className="bg-[#F0F4FF] px-3 py-2 rounded-lg font-mono text-sm font-bold text-[#2D3748] border border-[#D7DBF2] block">
                      {vendor.promoCode}
                    </code>
                  </div>
                )}
                
                {/* Contact Info */}
                <div className="text-xs text-[#6B7280] space-y-2 mt-auto">
                  {vendor.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.contactPhone && vendor.contactPhone !== "Not provided" && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span>{vendor.contactPhone}</span>
                    </div>
                  )}
                  {vendor.location && vendor.location !== "Not specified" && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{vendor.location}</span>
                    </div>
                  )}
                </div>

                {/* Terms (if short) */}
                {vendor.terms && vendor.terms !== "No specific terms" && vendor.terms.length < 60 && (
                  <div className="mt-3 pt-3 border-t border-[#EAECF0]">
                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <FileText className="w-3 h-3" />
                      <span className="truncate">{vendor.terms}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          renderEmptyState()
        )}
      </CardContent>
    </Card>
  );

  // Render vendor cards in list layout (original)
  const renderListLayout = () => (
    <Card
      style={{
        ...EOcardStyles.base,
        border: `2px solid ${EOcolors.lightSilver}`,
      }}
    >
      <CardHeader
        style={{
          paddingBottom: "1.5rem",
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        {renderHeader()}
        {renderFilters()}
      </CardHeader>

      <CardContent className="px-0 pt-4">
      {loading ? (
          renderLoadingState()
        ) : filteredVendors.length > 0 ? (
          <div className="space-y-4">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor._id}
                className="vendor-partner-card bg-white rounded-2xl shadow-md border border-[#EAECF0] p-6"
                style={{
                  border: `2px solid ${EOcolors.lightSilver}`,
                  borderRadius: EOradius.lg,
                }}
              >
                <div className="flex items-start gap-6">
                  {/* Left mini card (discount) */}
                  <div className="flex-shrink-0 bg-[#F5FAFF] rounded-2xl border border-[#E0F2FE] px-4 py-3 text-center min-w-[140px]">
                    <div className="text-[11px] font-semibold tracking-[0.12em] text-[#64748B] mb-1">
                      VENDOR
                    </div>
                    <div className="text-[11px] text-[#9CA3AF] mb-1">
                      Discount:
                    </div>
                    <div className="text-2xl font-extrabold text-[#111827]">
                      {vendor.discountRate > 0
                        ? `${vendor.discountRate}%`
                        : "N/A"}
                    </div>
                  </div>

                  {/* Right content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row: name + status + view details */}
                    <div className="flex items-start justify-between mb-2 gap-4">
                      <div>
                        <h3 className="text-[1.1rem] font-extrabold text-[#083344] mb-1">
                          {vendor.companyName}
                        </h3>
                        <p className="text-[0.85rem] text-[#64748B]">
                          GUC Loyalty Partner • {vendor.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`px-4 py-1 text-xs font-semibold rounded-full border ${
                            vendor.isActive
                              ? "border-[#16A34A] text-[#16A34A] bg-[#ECFDF3]"
                              : "border-[#9CA3AF] text-[#4B5563] bg-[#F3F4F6]"
                          }`}
                        >
                          {vendor.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[#6B7280] text-sm mb-3 line-clamp-2">
                      {vendor.description}
                    </p>

                    {/* Contact info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B7280] mb-4">
                      {vendor.email && (
                        <div className="flex items-center gap-1 min-w-[160px]">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{vendor.email}</span>
                        </div>
                      )}
                      {vendor.contactPhone &&
                        vendor.contactPhone !== "Not provided" && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{vendor.contactPhone}</span>
                          </div>
                        )}
                      {vendor.location &&
                        vendor.location !== "Not specified" && (
                          <div className="flex items-center gap-1 min-w-[140px]">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">
                              {vendor.location}
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Promo + terms */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B7280] mb-4">
                      {vendor.promoCode && vendor.promoCode !== "N/A" && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Promo Code:</span>
                          <code className="bg-[#F0F4FF] px-3 py-1 rounded-lg font-mono text-[#2D3748] border border-[#D7DBF2]">
                            {vendor.promoCode}
                          </code>
                        </div>
                      )}

                      {vendor.terms &&
                        vendor.terms !== "No specific terms" && (
                          <div className="flex items-center gap-2 min-w-[160px]">
                            <FileText className="w-4 h-4" />
                            <span className="truncate">
                              {vendor.terms}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          renderEmptyState()
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <style>{`
        @keyframes vendorPartnersSlideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes vendorPartnersSlideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vendor-partners-container { animation: vendorPartnersSlideInDown 0.4s ease-out; }
        .vendor-partner-card {
          transition: ${EOtransitions.normal};
          animation: vendorPartnersSlideInUp 0.3s ease-out;
        }
        .vendor-partner-card:hover {
          transform: translateY(-4px);
          box-shadow: ${EOshadows.lg};
        }
          [data-radix-card-header] {
          padding-bottom: 0.5rem !important;
        }
      `}</style>

      <div className="vendor-partners-container">
        {layout === "list" ? renderListLayout() : renderGridLayout()}
      </div>
    </>
  );
}