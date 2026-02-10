import React, { useState } from 'react';
import { 
  Calendar, Store, Users, FileText, Award, Heart, 
  QrCode, MessageSquare, Dumbbell, MapPin, Shield
} from 'lucide-react';

// ============================================================================
// REUSABLE LOADING COMPONENTS
// ============================================================================

export const FullPageLoader = ({ message = "Loading..." }) => (
  <div className="fixed inset-0 bg-gradient-to-br from-[#F8F9FA] to-[#F0F2FF] flex items-center justify-center z-50">
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6F7EEA] to-[#D7DBF2] rounded-full animate-pulse"></div>
        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
          <Calendar className="w-10 h-10 text-[#6F7EEA] animate-bounce" />
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-3 h-3 bg-[#6F7EEA] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-[#D7DBF2] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-[#E5E9D5] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <p className="text-[#816251] font-medium text-lg">{message}</p>
    </div>
  </div>
);
export const CardSkeleton = ({ count = 3 }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-6 bg-gradient-to-r from-[#F0F2FF] to-[#E5E9D5] rounded-lg w-3/4 mb-3"></div>
            <div className="h-4 bg-[#F0F4FF] rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-[#F0F2FF] rounded-full"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          {[...Array(4)].map((_, j) => (
            <div key={j}>
              <div className="h-3 bg-[#F0F4FF] rounded w-16 mb-2"></div>
              <div className="h-4 bg-gradient-to-r from-[#F0F2FF] to-[#E5E9D5] rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </>
);

export const TableSkeleton = ({ rows = 5, columns = 5 }) => (
  <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
    <div className="bg-[#F0F4FF] border-b border-[#E2E8F0]">
      <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="h-4 bg-[#D7DBF2] rounded animate-pulse"></div>
        ))}
      </div>
    </div>
    {[...Array(rows)].map((_, rowIndex) => (
      <div key={rowIndex} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
        <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gradient-to-r from-[#F0F2FF] to-[#E5E9D5] rounded animate-pulse" style={{ animationDelay: `${rowIndex * 100 + colIndex * 50}ms` }}></div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const ListItemSkeleton = ({ count = 5 }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#F0F2FF] to-[#E5E9D5] rounded-lg flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-5 bg-[#F0F2FF] rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-[#E5E9D5] rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-[#F0F4FF] rounded w-2/3"></div>
          </div>
        </div>
      </div>
    ))}
  </>
);

// ============================================================================
// REUSABLE EMPTY STATE COMPONENT
// ============================================================================

// In LoadingEmptyStates.jsx - Update the EmptyState component
export const EmptyState = ({ 
  icon: Icon = Calendar, 
  title, 
  description, 
  action
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-12 text-center">
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#F0F2FF] flex items-center justify-center">
      <Icon className="w-10 h-10 text-[#6F7EEA]" />
    </div>
    <h3 className="text-xl font-semibold text-[#2D3748] mb-2">{title}</h3>
    <p className="text-[#718096] mb-6 max-w-md mx-auto">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-8 py-3 bg-[#6F7EEA] hover:bg-[#5A6BD7] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {action.label}
      </button>
    )}
  </div>
);
// ============================================================================
// SPECIFIC EMPTY STATES FOR EACH DASHBOARD
// ============================================================================

// Professor Dashboard - Workshops
export const NoWorkshopsState = ({ onCreateClick }) => (
  <EmptyState
    icon={Calendar}
    title="No Workshops"
    description="No workshops currently available."
    action={{ label: "+ Create Workshop", onClick: onCreateClick }}
  />
);

// Events Office - Bazaars
export const NoBazaarsState = ({ onCreateClick }) => (
  <EmptyState
    icon={Store}
    title="No Bazaars"
    description="Create a bazaar event to engage vendors and students"
  />
);

// Events Office - Trips
export const NoTripsState = ({ onCreateClick }) => (
  <EmptyState
    icon={MapPin}
    title="No Trips"
    description="Plan exciting trips for students to explore"
    action={{ label: "+ Plan Trip", onClick: onCreateClick }}
  />
);

// Admin Dashboard - Users
export const NoUsersState = () => (
  <EmptyState
    icon={Users}
    title="No Users Found"
    description="Try adjusting your search or filters"
  />
);

// Add this to your LoadingEmptyStates.jsx
export const NoWorkshopsManagementState = ({ title = "No Workshops Available", description = "There are no workshops submitted for review at this time." }) => (
  <EmptyState
    icon={Calendar}
    title={title}
    description={description}
    // No action prop passed, so no button will be rendered
  />
);

// Admin Dashboard - Admins
export const NoAdminsState = ({ onCreateClick }) => (
  <EmptyState
    icon={Shield}
    title="No Admins Found"
    description="Create admin accounts to manage the system"
    action={onCreateClick ? { label: "+ Create Admin", onClick: onCreateClick } : null}
  />
);

// Student/TA/Staff - Events
export const NoEventsState = () => (
  <EmptyState
    icon={Calendar}
    title="No Events Available"
    description="Check back later for new opportunities"
  />
);

// Student/TA/Staff - Favorites
export const NoFavoritesState = () => (
  <EmptyState
    icon={Heart}
    title="No Favorites"
    description="Click the heart icon on events to add favorites"
  />
);

// Student/TA/Staff - Registrations
export const NoRegistrationsState = () => (
  <EmptyState
    icon={Users}
    title="No Registrations"
    description="Browse events and register to participate"
  />
);

// Vendor - Applications
export function NoApplicationsState({ type = "bazaar", iconColor = "#307B8E" }) {
  const Icon = type === "booth" ? MapPin : Store;
  const label = type === "booth" ? "No booth applications" : "No bazaar applications";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <Icon className="w-16 h-16 mx-auto mb-4" style={{ color: iconColor }} />
      <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
      <p className="text-gray-600 mt-2">You have not submitted any {type} applications yet.</p>
    </div>
  );
}

// Vendor - Documents
export const NoDocumentsState = () => (
  <EmptyState
    icon={FileText}
    title="No Documents"
    description="Upload your tax card and logo to complete profile"
  />
);

// Vendor - QR Codes
export const NoVisitorsState = () => (
  <EmptyState
    icon={QrCode}
    title="No Visitors"
    description="Visitor QR codes appear when they register"
  />
);

// Events Office - Polls
export const NoPollsState = ({ onCreateClick }) => (
  <EmptyState
    icon={Award}
    title="No Polls"
    description="Create a poll to gather feedback"
    action={onCreateClick ? { label: "+ Create Poll", onClick: onCreateClick } : null}
  />
);

// Comments
export const NoCommentsState = () => (
  <EmptyState
    icon={MessageSquare}
    title="No Comments"
    description="Be the first to share your thoughts"
  />
);

// Gym Slots - FIXED: Added onCreateClick prop and fixed typo
export const NoGymSlotsState = ({ onCreateClick }) => (
  <EmptyState
    icon={Dumbbell}
    title="No Available Slots"
    description="Create gym slots to get started"
    action={onCreateClick ? { label: "+ Create Slot", onClick: onCreateClick } : null}
  />
);

// Court Bookings
export const NoCourtBookingsState = () => (
  <EmptyState
    icon={MapPin}
    title="No Court Bookings"
    description="Reserve a court to start playing"
  />
);

// Search Results
export const NoSearchResultsState = ({ searchTerm }) => (
  <EmptyState
    icon={Calendar}
    title="No Results Found"
    description={searchTerm ? `No events found matching "${searchTerm}"` : "Try adjusting your search or filters"}
  />
);

// ============================================================================
// DEMO IMPLEMENTATION
// ============================================================================

const LoadingEmptyStatesDemo = () => {
  const [activeDemo, setActiveDemo] = useState('workshops-loading');
  
  const demos = [
    { id: 'workshops-loading', label: 'Workshops Loading', category: 'loading' },
    { id: 'table-loading', label: 'Table Loading', category: 'loading' },
    { id: 'list-loading', label: 'List Loading', category: 'loading' },
    { id: 'fullpage-loading', label: 'Full Page Loading', category: 'loading' },
    { id: 'workshops-empty', label: 'No Workshops', category: 'empty' },
    { id: 'bazaars-empty', label: 'No Bazaars', category: 'empty' },
    { id: 'trips-empty', label: 'No Trips', category: 'empty' },
    { id: 'events-empty', label: 'No Events', category: 'empty' },
    { id: 'favorites-empty', label: 'No Favorites', category: 'empty' },
    { id: 'applications-empty', label: 'No Applications', category: 'empty' },
    { id: 'visitors-empty', label: 'No Visitors', category: 'empty' },
    { id: 'polls-empty', label: 'No Polls', category: 'empty' },
    { id: 'gym-empty', label: 'No Gym Slots', category: 'empty' }, // Added gym demo
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F0F2FF] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#2D3748] mb-2">Loading & Empty States Library</h1>
          <p className="text-[#718096] mb-6">Professional components for your dashboards</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm font-semibold text-[#2D3748]">Loading States:</span>
            {demos.filter(d => d.category === 'loading').map(demo => (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeDemo === demo.id
                    ? 'bg-gradient-to-r from-[#6F7EEA] to-[#D7DBF2] text-white shadow-md'
                    : 'bg-[#F0F4FF] text-[#6F7EEA] hover:bg-[#E0E7FF]'
                }`}
              >
                {demo.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-semibold text-[#2D3748]">Empty States:</span>
            {demos.filter(d => d.category === 'empty').map(demo => (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeDemo === demo.id
                    ? 'bg-gradient-to-r from-[#6F7EEA] to-[#D7DBF2] text-white shadow-md'
                    : 'bg-[#F0F4FF] text-[#6F7EEA] hover:bg-[#E0E7FF]'
                }`}
              >
                {demo.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {activeDemo === 'workshops-loading' && <CardSkeleton count={3} />}
          {activeDemo === 'table-loading' && <TableSkeleton rows={8} columns={5} />}
          {activeDemo === 'list-loading' && <ListItemSkeleton count={4} />}
          {activeDemo === 'fullpage-loading' && (
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <FullPageLoader message="Loading your dashboard..." />
            </div>
          )}
          {activeDemo === 'workshops-empty' && <NoWorkshopsState onCreateClick={() => alert('Create clicked!')} />}
          {activeDemo === 'bazaars-empty' && <NoBazaarsState onCreateClick={() => alert('Create clicked!')} />}
          {activeDemo === 'trips-empty' && <NoTripsState onCreateClick={() => alert('Create clicked!')} />}
          {activeDemo === 'events-empty' && <NoEventsState />}
          {activeDemo === 'favorites-empty' && <NoFavoritesState />}
          {activeDemo === 'applications-empty' && <NoApplicationsState type="bazaar" />}
          {activeDemo === 'visitors-empty' && <NoVisitorsState />}
          {activeDemo === 'polls-empty' && <NoPollsState onCreateClick={() => alert('Create clicked!')} />}
          {activeDemo === 'gym-empty' && <NoGymSlotsState onCreateClick={() => alert('Create gym slot clicked!')} />}
        </div>

        {/* Implementation Guide */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-[#E2E8F0]">
          <h2 className="text-2xl font-bold text-[#2D3748] mb-4">Implementation Guide</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-[#6F7EEA] pl-4">
              <h3 className="font-semibold text-[#2D3748] mb-2">1. Import Components</h3>
              <pre className="bg-[#F8FAFC] p-3 rounded text-sm overflow-x-auto">
{`import { 
  FullPageLoader, 
  CardSkeleton, 
  TableSkeleton,
  NoWorkshopsState,
  NoGymSlotsState
} from '../components/LoadingEmptyStates';`}
              </pre>
            </div>

            <div className="border-l-4 border-[#D7DBF2] pl-4">
              <h3 className="font-semibold text-[#2D3748] mb-2">2. Use in Your Component</h3>
              <pre className="bg-[#F8FAFC] p-3 rounded text-sm overflow-x-auto">
{`// Show loading skeleton while fetching
{loading && <CardSkeleton count={3} />}

// Show empty state when no data
{!loading && sessions.length === 0 && (
  <NoGymSlotsState onCreateClick={() => setOpenCreate(true)} />
)}

// Show actual content when data exists
{!loading && sessions.length > 0 && (
  <div>Your session cards here</div>
)}`}
              </pre>
            </div>

            <div className="border-l-4 border-[#E5E9D5] pl-4">
              <h3 className="font-semibold text-[#2D3748] mb-2">3. Full Page Loading</h3>
              <pre className="bg-[#F8FAFC] p-3 rounded text-sm overflow-x-auto">
{`// Use for initial page loads
{isInitialLoad && <FullPageLoader message="Loading dashboard..." />}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingEmptyStatesDemo;