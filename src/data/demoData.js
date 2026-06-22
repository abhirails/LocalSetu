// LocalSetu Demo Data - Kharghar, Navi Mumbai pilot

const now = Date.now()
const mins = (n) => new Date(now - n * 60 * 1000).toISOString()
const hours = (n) => new Date(now - n * 60 * 60 * 1000).toISOString()
const hoursAhead = (n) => new Date(now + n * 60 * 60 * 1000).toISOString()
const daysAhead = (n) => new Date(now + n * 24 * 60 * 60 * 1000).toISOString()

export const DEMO_USERS = [
  {
    id: 'user_1', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@example.com',
    locality: 'Kharghar Sector 20', role: 'resident', isVerified: true, trustScore: 82,
    joinedAt: '2024-01-15T10:00:00Z', savedPosts: [], blockedUsers: [], postsCount: 7, helpCount: 3
  },
  {
    id: 'user_2', name: 'Priya Menon', phone: '9876543211', email: 'priya@example.com',
    locality: 'Kharghar Sector 12', role: 'resident', isVerified: false, trustScore: 65,
    joinedAt: '2024-02-10T10:00:00Z', savedPosts: [], blockedUsers: [], postsCount: 4, helpCount: 2
  },
  {
    id: 'user_3', name: 'Ajay Patil', phone: '9876543212', email: 'ajay@example.com',
    locality: 'Kharghar Sector 7', role: 'resident', isVerified: true, trustScore: 90,
    joinedAt: '2024-01-05T10:00:00Z', savedPosts: [], blockedUsers: [], postsCount: 14, helpCount: 9
  },
  {
    id: 'user_4', name: 'Sneha Iyer', phone: '9876543213', email: 'sneha@example.com',
    locality: 'Nerul Sector 25', role: 'resident', isVerified: false, trustScore: 60,
    joinedAt: '2024-03-01T10:00:00Z', savedPosts: [], blockedUsers: [], postsCount: 3, helpCount: 1
  },
  {
    id: 'user_5', name: 'Vikram Nair', phone: '9876543214', email: 'vikram@example.com',
    locality: 'Kamothe Sector 4', role: 'resident', isVerified: true, trustScore: 75,
    joinedAt: '2024-01-20T10:00:00Z', savedPosts: [], blockedUsers: [], postsCount: 8, helpCount: 5
  },
  {
    id: 'admin_1', name: 'Meera Joshi', phone: '9876540000', email: 'admin@localsetu.com',
    locality: 'Kharghar Sector 1', role: 'admin', isVerified: true, trustScore: 100,
    joinedAt: '2024-01-01T10:00:00Z', savedPosts: [], blockedUsers: [], postsCount: 2, helpCount: 1
  }
]

export const DEMO_POSTS = [
  {
    id: 'post_1', type: 'right_now', userId: 'user_3', locality: 'Kharghar Sector 12',
    category: 'water',
    content: 'Pani nahi aa raha Sector 12 mein since morning. CIDCO ka koi update nahi. RO bhi khatam ho raha hai.',
    createdAt: mins(45), expiresAt: hoursAhead(11), status: 'active', reportCount: 0,
    stillHappeningCount: 8, lastConfirmedAt: mins(5), confirmedBy: ['user_1', 'user_2', 'user_4', 'user_5']
  },
  {
    id: 'post_2', type: 'right_now', userId: 'user_1', locality: 'Palm Beach Road',
    category: 'traffic',
    content: 'Heavy traffic near Palm Beach Road entry point. Accident ahead. Avoid if possible, try Sion-Panvel Highway.',
    createdAt: mins(20), expiresAt: hoursAhead(6), status: 'active', reportCount: 0,
    stillHappeningCount: 5, lastConfirmedAt: mins(8), confirmedBy: ['user_2', 'user_5', 'user_3']
  },
  {
    id: 'post_3', type: 'right_now', userId: 'user_2', locality: 'Kharghar Sector 35',
    category: 'power',
    content: 'Light gaya Sector 35 mein. MSEDCL said 3 PM but still no power at 5:30 PM. Anyone else affected?',
    createdAt: hours(2), expiresAt: hoursAhead(10), status: 'active', reportCount: 0,
    stillHappeningCount: 12, lastConfirmedAt: mins(15), confirmedBy: ['user_1', 'user_4', 'user_5', 'user_3']
  },
  {
    id: 'post_4', type: 'right_now', userId: 'user_5', locality: 'Bandra Station',
    category: 'transport',
    content: 'Bandra station pe auto strike hai. No autos from station to Linking Road. Take rickshaw from Bandra East.',
    createdAt: hours(1), expiresAt: hoursAhead(5), status: 'active', reportCount: 0,
    stillHappeningCount: 3, lastConfirmedAt: hours(1), confirmedBy: ['user_4']
  },
  {
    id: 'post_5', type: 'right_now', userId: 'user_4', locality: 'Linking Road, Bandra',
    category: 'police',
    content: "Police checking on Linking Road near Shopper's Stop. Document checking. Keep RC, DL, insurance ready.",
    createdAt: mins(90), expiresAt: hoursAhead(4), status: 'active', reportCount: 0,
    stillHappeningCount: 4, lastConfirmedAt: mins(30), confirmedBy: ['user_1', 'user_2']
  },
  {
    id: 'post_6', type: 'right_now', userId: 'user_3', locality: 'Nerul Sector 19',
    category: 'power',
    content: 'Nerul mein 3 hours se power cut. Sector 19, 20, 21 affected. Backup generator bhi nahi chal raha.',
    createdAt: hours(3), expiresAt: hoursAhead(9), status: 'active', reportCount: 0,
    stillHappeningCount: 6, lastConfirmedAt: hours(1), confirmedBy: ['user_1', 'user_2', 'user_5']
  },
  {
    id: 'post_7', type: 'need_it_now', userId: 'user_1', locality: 'Kharghar Sector 7',
    category: 'borrow',
    content: 'Drill machine chahiye 2 ghante ke liye. Wall drilling karna hai. Will return by evening. Sector 7.',
    createdAt: mins(30), expiresAt: daysAhead(1), status: 'active', reportCount: 0,
    neededBy: hoursAhead(4), distanceRange: '2km', helperCount: 1, isFulfilled: false
  },
  {
    id: 'post_8', type: 'need_it_now', userId: 'user_2', locality: 'Panvel',
    category: 'rideshare',
    content: 'Anyone going to Mumbai Airport (T2) tomorrow? 5:30 AM flight. Happy to split Ola/Uber fare. Starting Panvel 3:30 AM.',
    createdAt: hours(1), expiresAt: daysAhead(2), status: 'active', reportCount: 0,
    neededBy: daysAhead(1), distanceRange: '5km', helperCount: 0, isFulfilled: false
  },
  {
    id: 'post_9', type: 'need_it_now', userId: 'user_4', locality: 'Bandra West',
    category: 'borrow',
    content: 'Need Dell laptop charger (65W, Type-L plug) for 1 day. Mine got damaged. Will return tomorrow.',
    createdAt: hours(2), expiresAt: daysAhead(1), status: 'active', reportCount: 0,
    neededBy: hoursAhead(6), distanceRange: '1km', helperCount: 0, isFulfilled: false
  },
  {
    id: 'post_10', type: 'need_it_now', userId: 'user_3', locality: 'Kharghar Sector 20',
    category: 'borrow',
    content: 'Need cricket bat for evening match today. Willow bat preferred. 3-4 ghante ke liye. Sector 20 ground, 5 PM.',
    createdAt: mins(60), expiresAt: hoursAhead(12), status: 'active', reportCount: 0,
    neededBy: hoursAhead(3), distanceRange: 'walking', helperCount: 2, isFulfilled: false
  },
  {
    id: 'post_11', type: 'need_it_now', userId: 'user_5', locality: 'Kharghar',
    category: 'ticket',
    content: 'Extra Coldplay Mumbai concert ticket available - Day 1. Face value only, no markup. This Saturday.',
    createdAt: hours(4), expiresAt: daysAhead(2), status: 'active', reportCount: 0,
    neededBy: daysAhead(3), distanceRange: '5km', helperCount: 3, isFulfilled: false
  }
]

export const DEMO_PROVIDERS = [
  {
    id: 'prov_1', name: 'Ramesh Bhai', serviceType: 'plumber', locality: 'Kharghar Sector 10',
    phone: '9876501001', whatsapp: '9876501001', recommendationCount: 5,
    notes: ['Fixed our bathroom leak same day, very honest about cost.', 'Came on time. Reasonable rates.', 'Has proper tools, no shortcuts.'],
    isVerified: true, recommenderIds: ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'],
    createdAt: '2024-01-10T10:00:00Z', lastRecommendedAt: hours(48)
  },
  {
    id: 'prov_2', name: 'Sunita Tai', serviceType: 'cook', locality: 'Kharghar Sector 20',
    phone: '9876501002', whatsapp: '9876501002', recommendationCount: 4,
    notes: ['Makes excellent Maharashtrian food. Very reliable.', 'Always on time, excellent hygiene.', 'Been working with us 2 years. Trustworthy.'],
    isVerified: true, recommenderIds: ['user_1', 'user_3', 'user_4', 'user_5'],
    createdAt: '2024-01-12T10:00:00Z', lastRecommendedAt: hours(24)
  },
  {
    id: 'prov_3', name: 'Meena Bai', serviceType: 'maid', locality: 'Nerul Sector 25',
    phone: '9876501003', whatsapp: '9876501003', recommendationCount: 6,
    notes: ['Very trustworthy. Works in our building for 3 years.', 'Does thorough cleaning, never cuts corners.', 'Available part-time or full-time.'],
    isVerified: true, recommenderIds: ['user_1', 'user_2', 'user_3', 'user_4', 'user_5', 'admin_1'],
    createdAt: '2024-01-08T10:00:00Z', lastRecommendedAt: hours(12)
  },
  {
    id: 'prov_4', name: 'Suresh Sir', serviceType: 'tuition', locality: 'Kharghar Sector 7',
    phone: '9876501004', whatsapp: '9876501004', recommendationCount: 7,
    notes: ['Excellent teacher for Math and Science up to Class 10.', "My daughter's marks went from 72% to 91% in one year.", 'Very patient with slow learners.'],
    isVerified: true, recommenderIds: ['user_1', 'user_2', 'user_3', 'user_4', 'user_5', 'admin_1'],
    createdAt: '2024-01-05T10:00:00Z', lastRecommendedAt: hours(6)
  },
  {
    id: 'prov_5', name: 'Raju Electrician', serviceType: 'electrician', locality: 'Ulwe Sector 3',
    phone: '9876501005', whatsapp: '9876501005', recommendationCount: 3,
    notes: ['Fixed our inverter wiring professionally.', 'Responds quickly on WhatsApp. Comes same day.', 'Reasonable rates.'],
    isVerified: true, recommenderIds: ['user_2', 'user_3', 'user_5'],
    createdAt: '2024-02-01T10:00:00Z', lastRecommendedAt: hours(36)
  },
  {
    id: 'prov_6', name: 'Deepa (Dog Walker)', serviceType: 'dog_walker', locality: 'Kharghar Sector 12',
    phone: '9876501006', whatsapp: '9876501006', recommendationCount: 2,
    notes: ['Very good with dogs, my Labrador loves her.', 'Reliable and on time. Morning and evening walks.'],
    isVerified: false, recommenderIds: ['user_1', 'user_2'],
    createdAt: '2024-02-15T10:00:00Z', lastRecommendedAt: hours(72)
  },
  {
    id: 'prov_7', name: 'Kiran Carpenter', serviceType: 'carpenter', locality: 'Kamothe Sector 4',
    phone: '9876501007', whatsapp: '9876501007', recommendationCount: 4,
    notes: ['Excellent woodwork. Made custom wardrobe for our room.', 'Neat finishing, honest quotation.', 'Completed on time.'],
    isVerified: true, recommenderIds: ['user_1', 'user_3', 'user_4', 'user_5'],
    createdAt: '2024-01-20T10:00:00Z', lastRecommendedAt: hours(20)
  }
]

export const DEMO_REPLIES = [
  { id: 'reply_1', postId: 'post_1', userId: 'user_2', content: 'Haan, same problem in Sector 11. Called CIDCO helpline but no answer.', replyType: 'custom', createdAt: mins(40) },
  { id: 'reply_2', postId: 'post_1', userId: 'user_5', content: 'Still happening! No water since 8 AM.', replyType: 'still_happening', createdAt: mins(20) },
  { id: 'reply_3', postId: 'post_1', userId: 'user_3', content: 'Neighbor told me CIDCO said water will come by 4 PM.', replyType: 'custom', createdAt: mins(15) },
  { id: 'reply_4', postId: 'post_2', userId: 'user_3', content: 'Still happening near Seawoods signal also.', replyType: 'still_happening', createdAt: mins(10) },
  { id: 'reply_5', postId: 'post_7', userId: 'user_2', content: 'I have one! Come to A-wing Sector 7 or I can drop at your place.', replyType: 'i_can_help', createdAt: mins(20) },
  { id: 'reply_6', postId: 'post_10', userId: 'user_1', content: 'Have a bat, will bring to Sector 20 ground by 5 PM.', replyType: 'i_can_help', createdAt: mins(45) },
  { id: 'reply_7', postId: 'post_10', userId: 'user_4', content: 'I also have one if the first offer does not work out.', replyType: 'i_can_help', createdAt: mins(30) },
  { id: 'reply_8', postId: 'post_11', userId: 'user_1', content: 'Interested! What is the face value? DM karo.', replyType: 'custom', createdAt: hours(3) },
  { id: 'reply_9', postId: 'post_3', userId: 'user_4', content: 'Sector 35 B wing bhi affected. Still no power.', replyType: 'still_happening', createdAt: hours(1) }
]

export const DEMO_REPORTS = [
  {
    id: 'report_1', reporterId: 'user_2', targetType: 'post', targetId: 'post_4',
    reason: 'false_info', createdAt: hours(2), status: 'pending',
    reporterNote: 'Auto strike ended 2 hours ago, this is outdated.'
  }
]

export const LOCALITIES = [
  { id: 'kharghar_s1', name: 'Kharghar Sector 1-5', area: 'Kharghar, Navi Mumbai' },
  { id: 'kharghar_s2', name: 'Kharghar Sector 6-12', area: 'Kharghar, Navi Mumbai' },
  { id: 'kharghar_s3', name: 'Kharghar Sector 13-20', area: 'Kharghar, Navi Mumbai' },
  { id: 'kharghar_s4', name: 'Kharghar Sector 21-36', area: 'Kharghar, Navi Mumbai' },
  { id: 'kamothe', name: 'Kamothe', area: 'Navi Mumbai' },
  { id: 'nerul', name: 'Nerul', area: 'Navi Mumbai' },
  { id: 'ulwe', name: 'Ulwe', area: 'Navi Mumbai' },
  { id: 'panvel', name: 'Panvel', area: 'Navi Mumbai' },
  { id: 'bandra_w', name: 'Bandra West', area: 'Mumbai' },
  { id: 'bandra_e', name: 'Bandra East', area: 'Mumbai' },
  { id: 'powai', name: 'Powai', area: 'Mumbai' }
]

export const CATEGORY_META = {
  traffic:   { label: 'Traffic', icon: 'Car', expiry: 6 },
  transport: { label: 'Transport', icon: 'Bus', expiry: 6 },
  police:    { label: 'Police', icon: 'Shield', expiry: 6 },
  water:     { label: 'Water Issue', icon: 'Drop', expiry: 12 },
  power:     { label: 'Power Cut', icon: 'Zap', expiry: 12 },
  weather:   { label: 'Weather', icon: 'Cloud', expiry: 6 },
  safety:    { label: 'Safety', icon: 'Alert', expiry: 12 },
  civic:     { label: 'Civic Issue', icon: 'Build', expiry: 12 },
  borrow:    { label: 'Borrow / Lend', icon: 'Hand', expiry: 24 },
  rideshare: { label: 'Ride Share', icon: 'Car', expiry: 48 },
  urgent:    { label: 'Urgent Help', icon: 'SOS', expiry: 24 },
  ticket:    { label: 'Spare Ticket', icon: 'Ticket', expiry: 48 },
  errand:    { label: 'Local Errand', icon: 'Box', expiry: 24 },
}

export const DEMO_SOCIETIES = [
  {
    id: 'soc_1', name: 'Shree Sainath CHS', sector: 'Sector 20',
    landmark: 'Near Kharghar Railway Station',
    description: 'Shree Sainath Co-operative Housing Society with 96 flats across 4 wings. Est. 2009.',
    rules: 'No loud music after 10 PM. Pets allowed on leash in common areas. Visitors must register at gate.',
    contactPhone: '9876500001', totalFlats: 96, adminId: null, isVerified: true, isPro: true, createdAt: hours(48 * 7)
  },
  {
    id: 'soc_2', name: 'Omkar Heights', sector: 'Sector 12',
    landmark: 'Opposite Central Park',
    description: 'Omkar Heights - 3 towers, 180 flats. Active residents welfare committee.',
    rules: 'Parking: one slot per flat. No commercial activity from flats. Guests allowed till 11 PM.',
    contactPhone: '9876500002', totalFlats: 180, adminId: null, isVerified: true, createdAt: hours(48 * 14)
  },
  {
    id: 'soc_3', name: 'Vrindavan CHS', sector: 'Sector 7',
    landmark: 'Near D-Mart Kharghar',
    description: 'Vrindavan Co-operative Housing Society. 64 flats, established community.',
    rules: null, contactPhone: '9876500003', totalFlats: 64, adminId: null, isVerified: true, createdAt: hours(48 * 10)
  },
  {
    id: 'soc_4', name: 'Palm Grove Residency', sector: 'Sector 35',
    landmark: 'Near Central Park Golf Course',
    description: 'Palm Grove Residency - gated community with 220 flats across 5 wings.',
    rules: null, contactPhone: '9876500004', totalFlats: 220, adminId: null, isVerified: false, createdAt: hours(48 * 5)
  },
  {
    id: 'soc_5', name: 'Shivam Apartments', sector: 'Sector 10',
    landmark: 'Near Kharghar Bus Depot',
    description: 'Shivam Apartments CHS. 48 flats, ground + 7 floors.',
    rules: null, contactPhone: '9876500005', totalFlats: 48, adminId: null, isVerified: false, createdAt: hours(48 * 3)
  }
]

export const DEMO_SOCIETY_POSTS = [
  {
    id: 'sp_1', societyId: 'soc_1', postedBy: 'user_1', type: 'notice',
    title: 'Water supply disruption - 15 June',
    content: 'Due to CIDCO pipeline maintenance, water supply to Wing A and B will be disrupted on 15 June from 9 AM to 3 PM. Please store water in advance.',
    eventDate: null, eventLocation: null, status: 'active', pinToFeed: true, createdAt: hours(3)
  },
  {
    id: 'sp_2', societyId: 'soc_1', postedBy: 'user_1', type: 'notice',
    title: 'Parking reminder - no overnight parking in visitor slots',
    content: 'Residents are requested not to park in visitor slots overnight. Action will be taken for repeated violations.',
    eventDate: null, eventLocation: null, status: 'active', pinToFeed: false, createdAt: hours(24)
  },
  {
    id: 'sp_3', societyId: 'soc_1', postedBy: 'user_1', type: 'event',
    title: 'Annual Society Meeting - 28 June',
    content: 'Annual General Meeting will be held on 28 June at 7 PM in the community hall. Agenda: maintenance bill review, security upgrades, terrace garden proposal. All flat owners requested to attend.',
    eventDate: daysAhead(7), eventLocation: 'Community Hall, Ground Floor', status: 'active', pinToFeed: true, createdAt: hours(6)
  },
  {
    id: 'sp_4', societyId: 'soc_2', postedBy: 'user_2', type: 'notice',
    title: 'Lift maintenance - Tower B lift out of service',
    content: 'Tower B lift will be under maintenance tomorrow from 10 AM to 2 PM. Please use the staircase or Tower A lift.',
    eventDate: null, eventLocation: null, status: 'active', pinToFeed: true, createdAt: hours(1)
  },
  {
    id: 'sp_5', societyId: 'soc_2', postedBy: 'user_2', type: 'event',
    title: 'Yoga and wellness camp - Sunday morning',
    content: 'Free yoga camp for all residents this Sunday, 7 AM to 8:30 AM at the podium garden. Certified instructor from Kharghar Yoga Kendra. Bring your own mat.',
    eventDate: daysAhead(3), eventLocation: 'Podium Garden, Tower A side', status: 'active', pinToFeed: true, createdAt: hours(12)
  },
  {
    id: 'sp_6', societyId: 'soc_4', postedBy: 'user_3', type: 'event',
    title: "Children's Day celebration - this Saturday",
    content: "Palm Grove Children's Day celebration on Saturday, 5 PM at the clubhouse. Games, prizes, snacks for all kids up to age 14.",
    eventDate: daysAhead(2), eventLocation: 'Clubhouse, Level 1', status: 'active', pinToFeed: true,
    visibility: 'public', createdAt: hours(8)
  },
  // Members-only posts (Phase 3)
  {
    id: 'sp_7', societyId: 'soc_1', postedBy: 'user_1', type: 'notice',
    title: 'Security guard duty roster — July',
    content: 'Attached is the updated security guard roster for July. Gate A will have 2 guards after 10 PM following the recent incidents.',
    eventDate: null, eventLocation: null, status: 'active', pinToFeed: false,
    visibility: 'society', createdAt: hours(2)
  },
  {
    id: 'sp_8', societyId: 'soc_1', postedBy: 'user_1', type: 'notice',
    title: 'Committee meeting notes — 18 June',
    content: 'Minutes from committee meeting: Approved ₹1.2L terrace garden budget. Water pump replacement scheduled for July 5. CCTV upgrade deferred to Q3.',
    eventDate: null, eventLocation: null, status: 'active', pinToFeed: false,
    visibility: 'committee', createdAt: hours(20)
  }
]

// Phase 3 — Society Members
export const DEMO_SOCIETY_MEMBERS = [
  // soc_1 (Shree Sainath) — user_1 is society admin (approved), user_2 approved resident, user_4 pending
  { id: 'mem_1', societyId: 'soc_1', userId: 'user_1', role: 'admin',     status: 'approved', requestedAt: hours(48 * 30), reviewedAt: hours(48 * 29), reviewedBy: null },
  { id: 'mem_2', societyId: 'soc_1', userId: 'user_2', role: 'resident',  status: 'approved', requestedAt: hours(48 * 20), reviewedAt: hours(48 * 19), reviewedBy: 'user_1' },
  { id: 'mem_3', societyId: 'soc_1', userId: 'user_3', role: 'committee', status: 'approved', requestedAt: hours(48 * 25), reviewedAt: hours(48 * 24), reviewedBy: 'user_1' },
  { id: 'mem_4', societyId: 'soc_1', userId: 'user_4', role: 'resident',  status: 'pending',  requestedAt: hours(3),       reviewedAt: null,           reviewedBy: null },
  { id: 'mem_5', societyId: 'soc_1', userId: 'user_5', role: 'resident',  status: 'pending',  requestedAt: hours(8),       reviewedAt: null,           reviewedBy: null },
  // soc_2 (Omkar Heights) — user_2 admin, user_3 approved resident
  { id: 'mem_6', societyId: 'soc_2', userId: 'user_2', role: 'admin',     status: 'approved', requestedAt: hours(48 * 15), reviewedAt: hours(48 * 14), reviewedBy: null },
  { id: 'mem_7', societyId: 'soc_2', userId: 'user_3', role: 'resident',  status: 'approved', requestedAt: hours(48 * 10), reviewedAt: hours(48 * 9),  reviewedBy: 'user_2' },
]

export const SERVICE_TYPES = [
  { id: 'cook', label: 'Cook', icon: 'Chef' },
  { id: 'maid', label: 'Maid', icon: 'Home' },
  { id: 'tuition', label: 'Tuition Teacher', icon: 'Book' },
  { id: 'dog_walker', label: 'Dog Walker', icon: 'Dog' },
  { id: 'plumber', label: 'Plumber', icon: 'Wrench' },
  { id: 'electrician', label: 'Electrician', icon: 'Zap' },
  { id: 'carpenter', label: 'Carpenter', icon: 'Tool' },
  { id: 'driver', label: 'Driver', icon: 'Car' },
  { id: 'babysitter', label: 'Babysitter', icon: 'Baby' },
  { id: 'home_nurse', label: 'Home Nurse', icon: 'Medical' },
]

// ============================================================
// Phase 4 — Verified Business Listings
// ============================================================
export const BUSINESS_CATEGORIES = [
  { id: 'all',       label: 'All',        icon: '🏪' },
  { id: 'grocery',   label: 'Grocery',    icon: '🛒' },
  { id: 'pharmacy',  label: 'Pharmacy',   icon: '💊' },
  { id: 'food',      label: 'Food',       icon: '🍱' },
  { id: 'salon',     label: 'Salon',      icon: '✂️' },
  { id: 'gym',       label: 'Gym/Yoga',   icon: '🏋️' },
  { id: 'coaching',  label: 'Coaching',   icon: '📚' },
  { id: 'repair',    label: 'Repair',     icon: '🔧' },
  { id: 'laundry',   label: 'Laundry',    icon: '👕' },
  { id: 'other',     label: 'Other',      icon: '🏢' },
]

export const DEMO_BUSINESSES = [
  {
    id: 'biz_1',
    name: 'Annapurna Supermarket',
    category: 'grocery',
    plan: 'premium',
    tagline: 'Fresh vegetables, groceries & dairy — delivered in 30 mins',
    description: 'Kharghar\'s most trusted grocery store. Fresh vegetables daily from Vashi APMC. Free delivery above ₹300. Accepts UPI, credit cards. Open 7 AM – 10 PM, all days.',
    phone: '9820001001',
    whatsapp: '9820001001',
    locality: 'Kharghar Sector 12',
    address: 'Shop 4, Hill Side Plaza, Sector 12, Kharghar',
    isVerified: true,
    rating: 4.6,
    reviewCount: 143,
    ownerId: null,
    planExpiresAt: daysAhead(180),
    createdAt: hours(48 * 60),
    openHours: '7:00 AM – 10:00 PM',
    tags: ['home delivery', 'UPI', 'fresh veg', 'dairy'],
  },
  {
    id: 'biz_2',
    name: 'MedPlus Pharmacy',
    category: 'pharmacy',
    plan: 'standard',
    tagline: 'Medicines, health check & home delivery',
    description: 'Authorised pharmacy with licensed chemists. Generic and branded medicines. Blood pressure, sugar & BMI check available. Delivery to Kharghar and Kamothe.',
    phone: '9820001002',
    whatsapp: '9820001002',
    locality: 'Kharghar Sector 20',
    address: 'Shop 7, Arihant Complex, Sector 20, Kharghar',
    isVerified: true,
    rating: 4.4,
    reviewCount: 97,
    ownerId: null,
    planExpiresAt: daysAhead(90),
    createdAt: hours(48 * 45),
    openHours: '8:00 AM – 11:00 PM',
    tags: ['generic medicines', 'home delivery', 'health check'],
  },
  {
    id: 'biz_3',
    name: 'Roti Ghar',
    category: 'food',
    plan: 'premium',
    tagline: 'Home-style North Indian tiffin & catering',
    description: 'Dal, chawal, sabji, roti tiffin service for working professionals. Monthly subscription ₹2,800 for lunch + dinner. Catering for events 50–500 people. No preservatives. Pure veg.',
    phone: '9820001003',
    whatsapp: '9820001003',
    locality: 'Kharghar Sector 7',
    address: 'Behind Kharghar Station, Sector 7',
    isVerified: true,
    rating: 4.8,
    reviewCount: 212,
    ownerId: null,
    planExpiresAt: daysAhead(150),
    createdAt: hours(48 * 50),
    openHours: '10:00 AM – 9:00 PM',
    tags: ['tiffin', 'catering', 'veg', 'monthly subscription'],
  },
  {
    id: 'biz_4',
    name: 'Style Zone Unisex Salon',
    category: 'salon',
    plan: 'standard',
    tagline: 'Haircut, colour, facial & bridal packages',
    description: 'Unisex salon with trained stylists. Specialises in keratin treatments, balayage, and bridal makeup. AC parlour. Appointment slots available. 10% discount for LocalSetu members.',
    phone: '9820001004',
    whatsapp: '9820001004',
    locality: 'Kharghar Sector 15',
    address: 'Shop 2, Rainbow Arcade, Sector 15, Kharghar',
    isVerified: true,
    rating: 4.3,
    reviewCount: 78,
    ownerId: null,
    planExpiresAt: daysAhead(60),
    createdAt: hours(48 * 30),
    openHours: '10:00 AM – 8:00 PM (Mon closed)',
    tags: ['haircut', 'keratin', 'bridal', 'unisex'],
  },
  {
    id: 'biz_5',
    name: 'Kharghar Fitness Hub',
    category: 'gym',
    plan: 'premium',
    tagline: 'Full-equipped gym + Zumba + yoga classes',
    description: '5,000 sq ft air-conditioned gym. Cardio zone, free weights, and group classes. Monthly ₹1,200. Annual ₹10,000. Certified trainers for weight loss and muscle building. Ladies batch 6 AM–8 AM.',
    phone: '9820001005',
    whatsapp: '9820001005',
    locality: 'Kharghar Sector 10',
    address: 'Level 2, Sports Complex, Near Central Park, Sector 10',
    isVerified: true,
    rating: 4.5,
    reviewCount: 134,
    ownerId: null,
    planExpiresAt: daysAhead(200),
    createdAt: hours(48 * 70),
    openHours: '5:30 AM – 11:00 PM',
    tags: ['gym', 'yoga', 'zumba', 'ladies batch', 'certified trainer'],
  },
  {
    id: 'biz_6',
    name: 'Brain Booster Coaching',
    category: 'coaching',
    plan: 'basic',
    tagline: 'Maths & Science for Class 8–12 + JEE/NEET',
    description: 'Small batch coaching for Std 8–12. Maths, Physics, Chemistry. JEE and NEET foundation batches. Ex-IIT faculty for Maths. Doubt clearing on WhatsApp. Free demo class.',
    phone: '9820001006',
    whatsapp: '9820001006',
    locality: 'Kharghar Sector 20',
    address: 'Room 12, Shree Arcade, Behind KV School, Sector 20',
    isVerified: true,
    rating: 4.7,
    reviewCount: 56,
    ownerId: null,
    planExpiresAt: daysAhead(30),
    createdAt: hours(48 * 20),
    openHours: '4:00 PM – 9:00 PM (Mon–Sat)',
    tags: ['JEE', 'NEET', 'maths', 'science', 'class 10', 'class 12'],
  },
  {
    id: 'biz_7',
    name: 'TechFix Mobile & Laptop Repair',
    category: 'repair',
    plan: 'standard',
    tagline: 'Phone screen, battery, laptop repair — same day',
    description: 'Authorised service centre for Samsung & Xiaomi. iPhone screen replacement available. Laptop motherboard repair. All parts with 90-day warranty. Home pick-up and drop ₹50 extra.',
    phone: '9820001007',
    whatsapp: '9820001007',
    locality: 'Kharghar Sector 12',
    address: 'Shop 18, Shivam Market, Sector 12, Kharghar',
    isVerified: true,
    rating: 4.2,
    reviewCount: 89,
    ownerId: null,
    planExpiresAt: daysAhead(75),
    createdAt: hours(48 * 35),
    openHours: '10:00 AM – 8:00 PM (Sun 11 AM – 5 PM)',
    tags: ['phone repair', 'laptop', 'screen replacement', 'battery', 'home pickup'],
  },
  {
    id: 'biz_8',
    name: 'CleanX Laundry & Dry Clean',
    category: 'laundry',
    plan: 'basic',
    tagline: 'Pick-up & delivery laundry service — 24 hr turnaround',
    description: 'Wash & fold ₹60/kg. Dry cleaning available. Pick-up and delivery within Kharghar and Kamothe. WhatsApp to schedule. Woollen and silk garments handled with care. Monthly plan for societies.',
    phone: '9820001008',
    whatsapp: '9820001008',
    locality: 'Kamothe Sector 4',
    address: 'Shop 3, Near Kamothe Bus Stand, Sector 4',
    isVerified: true,
    rating: 4.1,
    reviewCount: 44,
    ownerId: null,
    planExpiresAt: daysAhead(30),
    createdAt: hours(48 * 15),
    openHours: '8:00 AM – 9:00 PM',
    tags: ['laundry', 'dry cleaning', 'home pickup', 'wash & fold'],
  },
  {
    id: 'biz_9',
    name: 'Green Leaf Café',
    category: 'food',
    plan: 'standard',
    tagline: 'Healthy bowls, wraps, smoothies & work-from-café',
    description: 'Kharghar\'s health café. Protein bowls, multigrain wraps, cold-pressed juices. Work desk space with WiFi (no extra charge above ₹200 order). Vegan and gluten-free options. Open weekends.',
    phone: '9820001009',
    whatsapp: '9820001009',
    locality: 'Kharghar Sector 7',
    address: 'Ground Floor, IT Park Exit 2, Sector 7, Kharghar',
    isVerified: false,
    rating: 4.5,
    reviewCount: 31,
    ownerId: null,
    planExpiresAt: daysAhead(45),
    createdAt: hours(48 * 10),
    openHours: '8:00 AM – 8:00 PM',
    tags: ['healthy food', 'vegan', 'cafe', 'work from cafe', 'smoothies'],
  },
]

// Post boost pricing
export const BOOST_OPTIONS = [
  { id: 'boost_24', label: '24 hours', price: 19, hours: 24 },
  { id: 'boost_48', label: '48 hours', price: 29, hours: 48 },
  { id: 'boost_72', label: '72 hours', price: 39, hours: 72 },
]
