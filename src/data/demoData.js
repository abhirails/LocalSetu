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
  traffic:   { label: 'Traffic', icon: '🚗', expiry: 6 },
  transport: { label: 'Transport', icon: '🚌', expiry: 6 },
  police:    { label: 'Police', icon: '👮', expiry: 6 },
  water:     { label: 'Water', icon: '💧', expiry: 12 },
  power:     { label: 'Power', icon: '⚡', expiry: 12 },
  weather:   { label: 'Weather', icon: '🌧️', expiry: 6 },
  safety:    { label: 'Safety', icon: '🚨', expiry: 12 },
  civic:     { label: 'Civic', icon: '🏗️', expiry: 12 },
  borrow:    { label: 'Borrow', icon: '🤝', expiry: 24 },
  rideshare: { label: 'Ride Share', icon: '🚕', expiry: 48 },
  urgent:    { label: 'Urgent', icon: '🆘', expiry: 24 },
  ticket:    { label: 'Ticket', icon: '🎫', expiry: 48 },
  errand:      { label: 'Errand', icon: '📦', expiry: 24 },
  need_to_buy: { label: 'Need to Buy', icon: '🛒', expiry: 24 },
  need_to_purchase: { label: 'Need to Buy', icon: '🛒', expiry: 24 },
  home_help: { label: 'Home Help', icon: '🔧', expiry: 24 },
  lost_found: { label: 'Lost & Found', icon: '🔑', expiry: 48 },
  medical:     { label: 'Medical', icon: '🏥', expiry: 12 },
}

export const CIVIC_SUBCATEGORIES = [
  { id: 'water',       label: 'Water Supply',  icon: '💧' },
  { id: 'garbage',     label: 'Garbage',        icon: '🗑️' },
  { id: 'streetlight', label: 'Streetlight',    icon: '💡' },
  { id: 'road',        label: 'Road / Pothole', icon: '🛣️' },
  { id: 'traffic',     label: 'Traffic',        icon: '🚦' },
  { id: 'drainage',    label: 'Drainage',       icon: '🌊' },
  { id: 'tree',        label: 'Tree / Branch',  icon: '🌳' },
  { id: 'safety',      label: 'Safety',         icon: '🚨' },
  { id: 'other',       label: 'Other',          icon: '🏗️' },
]

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
  { id: 'home_nurse',   label: 'Home Nurse',          icon: 'Medical' },
  { id: 'doctor',       label: 'Doctor (GP)',          icon: 'Stethoscope' },
  { id: 'dentist',      label: 'Dentist',              icon: 'Tooth' },
  { id: 'physio',       label: 'Physiotherapist',      icon: 'Activity' },
  { id: 'ayurvedic',    label: 'Ayurvedic / Homeopathy', icon: 'Leaf' },
  { id: 'music_teacher',  label: 'Music Teacher',    icon: 'Music' },
  { id: 'dance_teacher',  label: 'Dance Teacher',    icon: 'Star' },
  { id: 'sports_coach',   label: 'Sports Coach',     icon: 'Award' },
  { id: 'language_tutor', label: 'Language Tutor',   icon: 'Globe' },
  { id: 'yoga_trainer',   label: 'Yoga Trainer',     icon: 'Heart' },
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
  { id: 'gym',       label: 'Gym / Yoga',       icon: '🏋️' },
  { id: 'wellness',   label: 'Wellness / Spa',    icon: '🧘' },
  { id: 'coaching',  label: 'Coaching',   icon: '📚' },
  { id: 'repair',    label: 'Repair',     icon: '🔧' },
  { id: 'laundry',   label: 'Laundry',    icon: '👕' },
  { id: 'clinic',     label: 'Hospital / Clinic', icon: '🏥' },
  { id: 'dental',     label: 'Dentist',           icon: '🦷' },
  { id: 'diagnostic', label: 'Diagnostic Lab',    icon: '🔬' },
  { id: 'blood',      label: 'Blood Bank',        icon: '🩸' },
  { id: 'vet',        label: 'Veterinary',        icon: '🐾' },
  { id: 'preschool',    label: 'Preschool / Nursery',  icon: '🏫' },
  { id: 'school',       label: 'School (K–12)',         icon: '📖' },
  { id: 'college',      label: 'College / Institute',   icon: '🎓' },
  { id: 'skill_training', label: 'Skill Training',      icon: '🛠️' },
  { id: 'music_art',    label: 'Music / Dance / Art',   icon: '🎵' },
  { id: 'sports',       label: 'Sports Academy',        icon: '⚽' },
  { id: 'other',      label: 'Other',             icon: '🏢' },
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

// ============================================================
// Phase 6 — RSVPs, Maintenance, Complaints
// ============================================================

export const DEMO_RSVPS = [
  // Annual Society Meeting (sp_3 - soc_1, event, daysAhead(7))
  { id: 'rsvp_1', societyPostId: 'sp_3', userId: 'user_1', status: 'going',     createdAt: hours(5) },
  { id: 'rsvp_2', societyPostId: 'sp_3', userId: 'user_2', status: 'going',     createdAt: hours(4) },
  { id: 'rsvp_3', societyPostId: 'sp_3', userId: 'user_3', status: 'maybe',     createdAt: hours(3) },
  // Yoga camp (sp_5 - soc_2)
  { id: 'rsvp_4', societyPostId: 'sp_5', userId: 'user_2', status: 'going',     createdAt: hours(10) },
  { id: 'rsvp_5', societyPostId: 'sp_5', userId: 'user_3', status: 'going',     createdAt: hours(8)  },
  // Children's Day (sp_6 - soc_4)
  { id: 'rsvp_6', societyPostId: 'sp_6', userId: 'user_4', status: 'going',     createdAt: hours(6)  },
  { id: 'rsvp_7', societyPostId: 'sp_6', userId: 'user_5', status: 'maybe',     createdAt: hours(5)  },
]

const daysBack = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

export const DEMO_MAINTENANCE_RECORDS = [
  {
    id: 'maint_1', societyId: 'soc_1',
    title: 'Water pump — bearing replacement',
    category: 'plumbing', status: 'resolved',
    description: 'Main water pump bearing worn out. Replaced by Shinde Plumbing Works.',
    vendorName: 'Shinde Plumbing Works', costEstimate: 8000, actualCost: 7500,
    reportedBy: 'user_1', assignedTo: 'Shinde Plumbing Works',
    createdAt: daysBack(14), resolvedAt: daysBack(10)
  },
  {
    id: 'maint_2', societyId: 'soc_1',
    title: 'CCTV camera — Gate B not recording',
    category: 'security', status: 'in_progress',
    description: 'CCTV camera at Gate B stopped recording after power surge. Technician scheduled.',
    vendorName: 'Secure Vision Pvt Ltd', costEstimate: 3500, actualCost: null,
    reportedBy: 'user_3', assignedTo: 'Secure Vision Pvt Ltd',
    createdAt: daysBack(3), resolvedAt: null
  },
  {
    id: 'maint_3', societyId: 'soc_1',
    title: 'Lobby light replacement — Wing C staircase',
    category: 'electrical', status: 'open',
    description: 'Fluorescent tube lights in Wing C staircase (floors 3–7) need replacement.',
    vendorName: null, costEstimate: 1200, actualCost: null,
    reportedBy: 'user_2', assignedTo: null,
    createdAt: daysBack(1), resolvedAt: null
  },
  {
    id: 'maint_4', societyId: 'soc_1',
    title: 'Terrace garden — monthly cleaning',
    category: 'common_area', status: 'resolved',
    description: 'Quarterly deep cleaning of terrace garden. Includes trimming, weeding, fertilising.',
    vendorName: 'Green Thumb Landscaping', costEstimate: 2000, actualCost: 2000,
    reportedBy: 'user_1', assignedTo: 'Green Thumb Landscaping',
    createdAt: daysBack(30), resolvedAt: daysBack(28)
  },
]

export const DEMO_COMPLAINTS = [
  {
    id: 'comp_1', societyId: 'soc_1', userId: 'user_2',
    title: 'Loud music from Flat 304 after 11 PM',
    category: 'noise', status: 'acknowledged',
    description: 'Repeated issue on Friday and Saturday nights. Already mentioned to security.',
    adminNote: 'Spoken to resident of 304. Will issue written notice if repeated.',
    createdAt: daysBack(5), resolvedAt: null
  },
  {
    id: 'comp_2', societyId: 'soc_1', userId: 'user_4',
    title: 'Visitor car blocking allocated parking slot B-12',
    category: 'parking', status: 'resolved',
    description: 'Happened 3 times this week. Request tow-away policy enforcement.',
    adminNote: 'New signage installed at B-12. Security instructed to tow unauthorised vehicles.',
    createdAt: daysBack(8), resolvedAt: daysBack(3)
  },
  {
    id: 'comp_3', societyId: 'soc_1', userId: 'user_5',
    title: 'Garbage not collected from 4th floor — 2 days',
    category: 'cleanliness', status: 'open',
    description: 'Housekeeping has missed the 4th floor collection for the past 2 days.',
    adminNote: null,
    createdAt: daysBack(1), resolvedAt: null
  },
]

export const MAINTENANCE_CATEGORIES = [
  { id: 'plumbing',    label: 'Plumbing',     icon: '🔧' },
  { id: 'electrical',  label: 'Electrical',   icon: '⚡' },
  { id: 'lift',        label: 'Lift',         icon: '🛗' },
  { id: 'common_area', label: 'Common Area',  icon: '🏢' },
  { id: 'security',    label: 'Security',     icon: '🔒' },
  { id: 'cleaning',    label: 'Cleaning',     icon: '🧹' },
  { id: 'other',       label: 'Other',        icon: '📋' },
]

export const COMPLAINT_CATEGORIES = [
  { id: 'noise',       label: 'Noise',        icon: '🔊' },
  { id: 'parking',     label: 'Parking',      icon: '🚗' },
  { id: 'cleanliness', label: 'Cleanliness',  icon: '🧹' },
  { id: 'security',    label: 'Security',     icon: '🔒' },
  { id: 'neighbour',   label: 'Neighbour',    icon: '👤' },
  { id: 'lift',        label: 'Lift',         icon: '🛗' },
  { id: 'water',       label: 'Water',        icon: '💧' },
  { id: 'other',       label: 'Other',        icon: '📋' },
]

export const DEMO_CIVIC_POSTS = [
  {
    id: 'civic_1', type: 'right_now', userId: 'user_1', locality: 'Kharghar Sector 20',
    category: 'civic', civicSubcategory: 'water', civicStatus: 'confirmed_by_locals',
    content: 'Kharghar Sector 20 mein aaj subah se pani pressure bahut kam hai. Kaafi logo ko problem ho rahi hai.',
    createdAt: hours(3), expiresAt: new Date(Date.now() + 9 * 3600000).toISOString(),
    stillHappeningCount: 11, confirmedBy: ['user_2','user_3','user_4'], isBoosted: false,
    status: 'active', isPinned: false, reportCount: 0, isFlagged: false,
  },
  {
    id: 'civic_2', type: 'right_now', userId: 'user_3', locality: 'Kharghar Sector 12',
    category: 'civic', civicSubcategory: 'garbage',  civicStatus: 'reported',
    content: 'Sector 12 market ke paas garbage 3 din se nahi utha. Smell aa rahi hai. CIDCO ko inform karna chahiye.',
    createdAt: hours(8), expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(),
    stillHappeningCount: 7, confirmedBy: ['user_5'], isBoosted: false,
    status: 'active', isPinned: false, reportCount: 0, isFlagged: false,
  },
  {
    id: 'civic_3', type: 'right_now', userId: 'user_2', locality: 'Kharghar Sector 21',
    category: 'civic', civicSubcategory: 'streetlight', civicStatus: 'reported',
    content: '3 streetlights near Central Park entry not working since last week. Very dark at night, safety concern.',
    createdAt: hours(26), expiresAt: new Date(Date.now() + 2 * 3600000).toISOString(),
    stillHappeningCount: 5, confirmedBy: ['user_4'], isBoosted: false,
    status: 'active', isPinned: false, reportCount: 0, isFlagged: false,
  },
  {
    id: 'civic_4', type: 'right_now', userId: 'user_5', locality: 'Kharghar Station Road',
    category: 'civic', civicSubcategory: 'road', civicStatus: 'resolved',
    content: 'Station road pe bada pothole tha near bus stand — aaj finally bhara gaya! NMMC ne action liya.',
    createdAt: hours(48), expiresAt: new Date(Date.now() + 1 * 3600000).toISOString(),
    stillHappeningCount: 0, confirmedBy: [], isBoosted: false,
    status: 'active', isPinned: false, reportCount: 0, isFlagged: false,
  },
  {
    id: 'civic_5', type: 'right_now', userId: 'user_4', locality: 'Nerul Sector 25',
    category: 'civic', civicSubcategory: 'drainage', civicStatus: 'reported',
    content: 'Drainage overflow near Sector 25 school gate after yesterday rain. Road waterlogged, risky for kids.',
    createdAt: hours(5), expiresAt: new Date(Date.now() + 7 * 3600000).toISOString(),
    stillHappeningCount: 9, confirmedBy: ['user_1','user_3'], isBoosted: false,
    status: 'active', isPinned: false, reportCount: 0, isFlagged: false,
  },
]


// ============================================================
// Phase 6.6 — Need to Buy / Local Quote
// ============================================================

export const SHOP_CATEGORIES = [
  { id: 'electrical',  label: 'Electrical',         icon: '⚡' },
  { id: 'hardware',    label: 'Hardware / Plumbing', icon: '🔧' },
  { id: 'stationery',  label: 'Stationery',          icon: '📝' },
  { id: 'mobile',      label: 'Mobile Accessories',  icon: '📱' },
  { id: 'grocery',     label: 'General Store',       icon: '🛒' },
]

export const DEMO_BUY_POSTS = [
  {
    id: 'buy_1', type: 'need_it_now', userId: 'user_1',
    locality: 'Kharghar Sector 20', category: 'need_to_buy',
    content: 'Need 2 modular 16A sockets and 1 three-pin plug. Today within 1 hour. Delivery preferred.',
    needToBuyItem: 'Modular 16A sockets + plug', needToBuyQty: '3 pieces',
    deliveryPref: 'delivery', budget: 250,
    createdAt: mins(25), expiresAt: hoursAhead(24), status: 'active', reportCount: 0,
    neededBy: hoursAhead(1), distanceRange: '2km',
    helperCount: 0, isFulfilled: false, selectedQuoteId: null, isBought: false,
  },
  {
    id: 'buy_2', type: 'need_it_now', userId: 'user_3',
    locality: 'Kharghar Sector 12', category: 'need_to_buy',
    content: 'Need A4 printing paper (1 ream, 500 sheets) and 5 blue ball pens. Urgent — need by 5 PM today for office work.',
    needToBuyItem: 'A4 paper + pens', needToBuyQty: '1 ream + 5 pens',
    deliveryPref: 'either', budget: 350,
    createdAt: hours(1), expiresAt: hoursAhead(12), status: 'active', reportCount: 0,
    neededBy: hoursAhead(3), distanceRange: '1km',
    helperCount: 0, isFulfilled: false, selectedQuoteId: 'quote_3', isBought: false,
  },
  {
    id: 'buy_3', type: 'need_it_now', userId: 'user_5',
    locality: 'Kamothe Sector 4', category: 'need_to_buy',
    content: 'Need half-inch brass elbow joint for pipe repair. 2 pieces. Can pickup from nearby shop.',
    needToBuyItem: 'Brass elbow joint (½ inch)', needToBuyQty: '2 pieces',
    deliveryPref: 'pickup', budget: null,
    createdAt: hours(2), expiresAt: hoursAhead(22), status: 'active', reportCount: 0,
    neededBy: hoursAhead(5), distanceRange: '2km',
    helperCount: 0, isFulfilled: false, selectedQuoteId: null, isBought: false,
  },
]

export const DEMO_QUOTES = [
  {
    id: 'quote_1', postId: 'buy_1', submittedBy: 'user_3',
    shopName: 'Raju Electricals', shopCategory: 'electrical',
    price: 180, deliveryTime: 35, deliveryCharge: 20,
    pickupAvailable: true, deliveryAvailable: true,
    paymentMode: 'both',
    message: 'All items in stock. Will pack and send in 35 min.',
    isAvailable: 'yes', isRemoved: false,
    createdAt: mins(18),
  },
  {
    id: 'quote_2', postId: 'buy_1', submittedBy: 'user_5',
    shopName: 'New Kharghar Hardware', shopCategory: 'hardware',
    price: 160, deliveryTime: null, deliveryCharge: 0,
    pickupAvailable: true, deliveryAvailable: false,
    paymentMode: 'cash',
    message: 'Pickup only. Shop near Sector 20 D-Mart. Open till 9 PM.',
    isAvailable: 'yes', isRemoved: false,
    createdAt: mins(12),
  },
  {
    id: 'quote_3', postId: 'buy_2', submittedBy: 'user_4',
    shopName: 'Star Stationery & Prints', shopCategory: 'stationery',
    price: 290, deliveryTime: 25, deliveryCharge: 30,
    pickupAvailable: true, deliveryAvailable: true,
    paymentMode: 'upi',
    message: 'JK Copier A4 ream + Cello pens. Deliver in 25 min or pickup anytime.',
    isAvailable: 'yes', isRemoved: false,
    createdAt: mins(50),
  },
]

// ============================================================
// Phase 6.7 — Medical (Right Now + Verified Help + Business)
// ============================================================

export const MEDICAL_SUBCATEGORIES = [
  { id: 'ambulance',   label: 'Ambulance',       icon: '🚑', urgent: true  },
  { id: 'blood',       label: 'Blood Donor',      icon: '🩸', urgent: true  },
  { id: 'doctor_home', label: 'Doctor at Home',   icon: '👨‍⚕️', urgent: false },
  { id: 'pharmacy',    label: 'Pharmacy / Medicine', icon: '💊', urgent: false },
  { id: 'hospital',    label: 'Hospital / Clinic', icon: '🏥', urgent: false },
  { id: 'other',       label: 'Other Medical',    icon: '⚕️', urgent: false },
]

export const DEMO_MEDICAL_POSTS = [
  {
    id: 'med_1', type: 'right_now', userId: 'user_2',
    locality: 'Kharghar Sector 20', category: 'medical',
    medicalSubcategory: 'blood',
    content: 'O+ blood needed urgently at Fortis Hospital Vashi — surgery scheduled for tomorrow morning. Please contact if you can donate. Very urgent.',
    createdAt: mins(15), expiresAt: hoursAhead(12), status: 'active', reportCount: 0,
    stillHappeningCount: 0, confirmedBy: [], isPinned: false, isBoosted: false, isFlagged: false,
  },
  {
    id: 'med_2', type: 'right_now', userId: 'user_4',
    locality: 'Kharghar Sector 12', category: 'medical',
    medicalSubcategory: 'ambulance',
    content: 'Ambulance needed near Sector 12. Elderly person collapsed. Anyone know the fastest route to NMC hospital or a nearby ambulance number?',
    createdAt: mins(5), expiresAt: hoursAhead(6), status: 'active', reportCount: 0,
    stillHappeningCount: 0, confirmedBy: [], isPinned: false, isBoosted: false, isFlagged: false,
  },
  {
    id: 'med_3', type: 'right_now', userId: 'user_1',
    locality: 'Kharghar', category: 'medical',
    medicalSubcategory: 'pharmacy',
    content: 'Which pharmacy is open 24 hours near Kharghar? Need blood pressure tablets urgently. Apollo/MedPlus near Sector 20 was closed.',
    createdAt: hours(1), expiresAt: hoursAhead(11), status: 'active', reportCount: 0,
    stillHappeningCount: 3, confirmedBy: ['user_3', 'user_5'], isPinned: false, isBoosted: false, isFlagged: false,
  },
]

export const DEMO_MEDICAL_PROVIDERS = [
  {
    id: 'prov_med_1', name: 'Dr. Priya Kulkarni', serviceType: 'doctor',
    locality: 'Kharghar Sector 12',
    phone: '9876502001', whatsapp: '9876502001', recommendationCount: 5,
    notes: ['Very thorough consultation, explains everything clearly.', 'Available for home visits in Kharghar. Responds on WhatsApp.', 'Reasonable fees, genuinely caring doctor.'],
    isVerified: true, recommenderIds: ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'],
    createdAt: '2024-02-01T10:00:00Z', lastRecommendedAt: hours(12),
  },
  {
    id: 'prov_med_2', name: 'Dr. Ashish Kadam', serviceType: 'dentist',
    locality: 'Kharghar Sector 7',
    phone: '9876502002', whatsapp: '9876502002', recommendationCount: 4,
    notes: ['Painless treatment, good with anxious patients.', 'Modern equipment, very clean clinic.', 'Affordable root canal and crowns.'],
    isVerified: true, recommenderIds: ['user_1', 'user_3', 'user_4', 'user_5'],
    createdAt: '2024-03-01T10:00:00Z', lastRecommendedAt: hours(36),
  },
]

export const DEMO_MEDICAL_BUSINESSES = [
  {
    id: 'biz_med_1',
    name: 'Kharghar Medicare Clinic',
    category: 'clinic',
    plan: 'standard',
    tagline: 'General physician, paediatrics & minor surgery — walk-ins welcome',
    description: 'Full-service outpatient clinic. General physician, paediatrician (Mon/Wed/Fri), ENT (Sat). ECG, blood tests, nebulisation on-site. Home visit available for senior citizens. English, Hindi, Marathi.',
    phone: '9820002001',
    whatsapp: '9820002001',
    locality: 'Kharghar Sector 20',
    address: 'Shop 3, Shivam Complex, Near Sector 20 Bus Stand, Kharghar',
    isVerified: true,
    rating: 4.5,
    reviewCount: 112,
    ownerId: null,
    planExpiresAt: daysAhead(120),
    createdAt: hours(48 * 40),
    openHours: '8:00 AM – 1:00 PM, 5:00 PM – 9:00 PM (Sun 9–1)',
    tags: ['general physician', 'paediatrics', 'ECG', 'home visit', 'walk-in'],
  },
  {
    id: 'biz_med_2',
    name: 'Smile Dental Studio',
    category: 'dental',
    plan: 'premium',
    tagline: 'Painless dentistry · Braces · Implants · Whitening',
    description: 'Modern dental clinic with digital X-rays and laser treatment. Root canal, crowns, braces (metal & invisible), teeth whitening, implants. Evening and Saturday appointments available. EMI options for major procedures.',
    phone: '9820002002',
    whatsapp: '9820002002',
    locality: 'Kharghar Sector 12',
    address: 'First Floor, Omkar Plaza, Sector 12, Kharghar',
    isVerified: true,
    rating: 4.7,
    reviewCount: 89,
    ownerId: null,
    planExpiresAt: daysAhead(180),
    createdAt: hours(48 * 55),
    openHours: '10:00 AM – 9:00 PM (Mon closed)',
    tags: ['braces', 'root canal', 'implants', 'whitening', 'painless'],
  },
  {
    id: 'biz_med_3',
    name: 'LifeCare Diagnostics',
    category: 'diagnostic',
    plan: 'standard',
    tagline: 'Blood tests, X-ray, ultrasound — reports in 4 hours',
    description: 'NABL-accredited diagnostic centre. Complete blood count, thyroid, diabetes, liver panel, vitamin profiles. Digital X-ray, ultrasound. Home sample collection available (₹100 extra). WhatsApp reports.',
    phone: '9820002003',
    whatsapp: '9820002003',
    locality: 'Kharghar Sector 7',
    address: 'Ground Floor, IT Park Road, Near D-Mart, Sector 7, Kharghar',
    isVerified: true,
    rating: 4.4,
    reviewCount: 67,
    ownerId: null,
    planExpiresAt: daysAhead(90),
    createdAt: hours(48 * 30),
    openHours: '7:00 AM – 9:00 PM (Sun 8 AM – 2 PM)',
    tags: ['blood test', 'X-ray', 'ultrasound', 'home collection', 'NABL'],
  },
]

// ── Phase 6.8  Education ─────────────────────────────────────────────────────
export const DEMO_EDUCATION_PROVIDERS = [
  {
    id: 'prov_edu_1',
    name: 'Priya Sharma',
    serviceType: 'music_teacher',
    locality: 'Kharghar Sector 15',
    phone: '9870003001',
    whatsapp: '9870003001',
    experience: '8 years',
    description: 'Classical and Bollywood vocals, harmonium, keyboard. Teaches kids from age 5. Online and home sessions available. RCM certified.',
    recommendedBy: ['user_1', 'user_3', 'user_4'],
    isVerified: true,
    rating: 4.8,
    reviewCount: 31,
    tags: ['vocals', 'keyboard', 'harmonium', 'kids', 'Bollywood'],
  },
  {
    id: 'prov_edu_2',
    name: 'Rahul Nair',
    serviceType: 'sports_coach',
    locality: 'Kharghar Sector 7',
    phone: '9870003002',
    whatsapp: '9870003002',
    experience: '6 years',
    description: 'Cricket and badminton coaching. NIS certified. Batches for 8–18 year olds. Individual and group sessions at Kharghar Sports Complex and CIDCO grounds.',
    recommendedBy: ['user_2', 'user_5'],
    isVerified: true,
    rating: 4.6,
    reviewCount: 18,
    tags: ['cricket', 'badminton', 'NIS', 'kids', 'youth'],
  },
]

export const DEMO_EDUCATION_BUSINESSES = [
  {
    id: 'biz_edu_1',
    name: 'Little Stars Playschool',
    category: 'preschool',
    plan: 'standard',
    tagline: 'Playgroup · Nursery · LKG · UKG — since 2015',
    description: 'CBSE-aligned preschool with Montessori-inspired learning. Playgroup (18 months+), Nursery, LKG, UKG. Trained female staff, CCTV, nutritious meals, after-school care. Admissions open for 2025–26.',
    phone: '9820004001',
    whatsapp: '9820004001',
    locality: 'Kharghar Sector 12',
    address: 'Row House 14, Sector 12, Kharghar, Navi Mumbai',
    isVerified: true,
    rating: 4.7,
    reviewCount: 54,
    ownerId: null,
    planExpiresAt: null,
    createdAt: hours(48 * 20),
    openHours: '8:00 AM – 1:00 PM (Mon–Sat)',
    tags: ['playgroup', 'nursery', 'LKG', 'UKG', 'Montessori', 'CCTV'],
  },
  {
    id: 'biz_edu_2',
    name: 'Rhythm Music & Dance Academy',
    category: 'music_art',
    plan: 'standard',
    tagline: 'Vocals · Keyboard · Guitar · Bharatanatyam · Zumba',
    description: 'All-in-one performing arts academy. Music: vocals (Indian classical, Bollywood), keyboard, guitar. Dance: Bharatanatyam, Bollywood, Zumba. Kids batches on weekends. Adult batches on weekdays evenings.',
    phone: '9820004002',
    whatsapp: '9820004002',
    locality: 'Kharghar Sector 20',
    address: 'First Floor, Sai Complex, Sector 20, Kharghar',
    isVerified: true,
    rating: 4.6,
    reviewCount: 41,
    ownerId: null,
    planExpiresAt: null,
    createdAt: hours(48 * 35),
    openHours: '4:00 PM – 8:00 PM (weekdays), 9:00 AM – 7:00 PM (weekends)',
    tags: ['vocals', 'keyboard', 'guitar', 'Bharatanatyam', 'Zumba', 'kids'],
  },
  {
    id: 'biz_edu_3',
    name: 'FitZone Sports Academy',
    category: 'sports',
    plan: 'standard',
    tagline: 'Cricket · Badminton · Football · Taekwondo · Skating',
    description: 'Multi-sport coaching for ages 6–18. NIS certified coaches for cricket and badminton. Indoor courts for badminton. Football and skating on CIDCO grounds. Trial session free. Annual sports camp in May.',
    phone: '9820004003',
    whatsapp: '9820004003',
    locality: 'Kharghar Sector 7',
    address: 'Kharghar Sports Complex, Sector 7, Kharghar',
    isVerified: true,
    rating: 4.5,
    reviewCount: 37,
    ownerId: null,
    planExpiresAt: null,
    createdAt: hours(48 * 28),
    openHours: '6:00 AM – 8:00 AM, 5:00 PM – 8:00 PM (Mon–Sat)',
    tags: ['cricket', 'badminton', 'football', 'taekwondo', 'skating', 'kids'],
  },
  {
    id: 'biz_edu_4',
    name: 'TechSkills Training Centre',
    category: 'skill_training',
    plan: 'standard',
    tagline: 'Tally · MS Office · Python · Graphic Design · CCTV Installation',
    description: 'Job-oriented skill training centre. Courses: Tally Prime, Advanced Excel, Python basics, Canva/Photoshop, hardware maintenance, CCTV installation. Weekend crash courses. Certificate on completion. Placement assistance.',
    phone: '9820004004',
    whatsapp: '9820004004',
    locality: 'Kharghar Sector 12',
    address: 'Ground Floor, Dhan Laxmi Building, Near Central Park, Sector 12, Kharghar',
    isVerified: false,
    rating: 4.3,
    reviewCount: 22,
    ownerId: null,
    planExpiresAt: null,
    createdAt: hours(48 * 15),
    openHours: '10:00 AM – 7:00 PM (Mon–Sat)',
    tags: ['Tally', 'Excel', 'Python', 'Photoshop', 'CCTV', 'certification'],
  },
]

// ── Phase 6.8b  Wellness ─────────────────────────────────────────────────────
export const DEMO_WELLNESS_PROVIDERS = [
  {
    id: 'prov_wel_1',
    name: 'Sneha Kulkarni',
    serviceType: 'yoga_trainer',
    locality: 'Kharghar Sector 15',
    phone: '9870005001',
    whatsapp: '9870005001',
    experience: '10 years',
    description: 'Certified Hatha & Pranayama yoga instructor. Morning and evening sessions. Beginners welcome. Senior citizen batches available. Online sessions on request.',
    recommendedBy: ['user_1', 'user_2', 'user_4', 'user_5'],
    isVerified: true,
    rating: 4.9,
    reviewCount: 47,
    tags: ['hatha', 'pranayama', 'seniors', 'beginners', 'online'],
  },
]

export const DEMO_WELLNESS_BUSINESSES = [
  {
    id: 'biz_wel_1',
    name: 'Serenity Wellness Studio',
    category: 'wellness',
    plan: 'premium',
    tagline: 'Yoga · Meditation · Aromatherapy · Stress relief',
    description: 'Holistic wellness centre offering yoga (Hatha, Vinyasa, Yin), guided meditation, sound healing, and aromatherapy sessions. Batch size limited to 8. Monthly memberships and single sessions available. First session free.',
    phone: '9820005001',
    whatsapp: '9820005001',
    locality: 'Kharghar Sector 20',
    address: 'B-Wing, Harmony Heights, Near Central Park, Sector 20, Kharghar',
    isVerified: true,
    rating: 4.8,
    reviewCount: 62,
    ownerId: null,
    planExpiresAt: null,
    createdAt: hours(48 * 22),
    openHours: '6:00 AM – 9:00 AM, 5:30 PM – 8:30 PM (Mon–Sat)',
    tags: ['yoga', 'meditation', 'sound healing', 'aromatherapy', 'stress', 'first session free'],
  },
  {
    id: 'biz_wel_2',
    name: 'NatureCure Wellness Centre',
    category: 'wellness',
    plan: 'standard',
    tagline: 'Naturopathy · Panchakarma · Massage · Cupping',
    description: 'Naturopathy and Ayurvedic wellness centre. Panchakarma detox packages, Abhyanga full-body massage, Shirodhara (head massage), cupping therapy, mud therapy. Consult with certified naturopath. Corporate wellness packages available.',
    phone: '9820005002',
    whatsapp: '9820005002',
    locality: 'Kharghar Sector 12',
    address: 'Ground Floor, Lotus Tower, Sector 12, Kharghar',
    isVerified: true,
    rating: 4.5,
    reviewCount: 33,
    ownerId: null,
    planExpiresAt: null,
    createdAt: hours(48 * 18),
    openHours: '9:00 AM – 7:00 PM (Mon–Sat, Sun by appointment)',
    tags: ['naturopathy', 'panchakarma', 'massage', 'Shirodhara', 'Ayurveda', 'detox'],
  },
]
