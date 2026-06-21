// LocalSetu Demo Data — Kharghar, Navi Mumbai pilot

const now = Date.now()
const mins = (n) => new Date(now - n * 60 * 1000).toISOString()
const hours = (n) => new Date(now - n * 60 * 60 * 1000).toISOString()
const hoursAhead = (n) => new Date(now + n * 60 * 60 * 1000).toISOString()
const daysAhead = (n) => new Date(now + n * 24 * 60 * 60 * 1000).toISOString()

export const DEMO_USERS = [
  {
    id: 'user_1',
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul@example.com',
    locality: 'Kharghar Sector 20',
    role: 'resident',
    isVerified: true,
    trustScore: 82,
    joinedAt: '2024-01-15T10:00:00Z',
    savedPosts: [],
    blockedUsers: [],
    postsCount: 7,
    helpCount: 3
  },
  {
    id: 'user_2',
    name: 'Priya Menon',
    phone: '9876543211',
    email: 'priya@example.com',
    locality: 'Kharghar Sector 12',
    role: 'resident',
    isVerified: false,
    trustScore: 65,
    joinedAt: '2024-02-10T10:00:00Z',
    savedPosts: [],
    blockedUsers: [],
    postsCount: 4,
    helpCount: 2
  },
  {
    id: 'user_3',
    name: 'Ajay Patil',
    phone: '9876543212',
    email: 'ajay@example.com',
    locality: 'Kharghar Sector 7',
    role: 'resident',
    isVerified: true,
    trustScore: 90,
    joinedAt: '2024-01-05T10:00:00Z',
    savedPosts: [],
    blockedUsers: [],
    postsCount: 14,
    helpCount: 9
  },
  {
    id: 'user_4',
    name: 'Sneha Iyer',
    phone: '9876543213',
    email: 'sneha@example.com',
    locality: 'Nerul Sector 25',
    role: 'resident',
    isVerified: false,
    trustScore: 60,
    joinedAt: '2024-03-01T10:00:00Z',
    savedPosts: [],
    blockedUsers: [],
    postsCount: 3,
    helpCount: 1
  },
  {
    id: 'user_5',
    name: 'Vikram Nair',
    phone: '9876543214',
    email: 'vikram@example.com',
    locality: 'Kamothe Sector 4',
    role: 'resident',
    isVerified: true,
    trustScore: 75,
    joinedAt: '2024-01-20T10:00:00Z',
    savedPosts: [],
    blockedUsers: [],
    postsCount: 8,
    helpCount: 5
  },
  {
    id: 'admin_1',
    name: 'Meera Joshi',
    phone: '9876540000',
    email: 'admin@localsetu.com',
    locality: 'Kharghar Sector 1',
    role: 'admin',
    isVerified: true,
    trustScore: 100,
    joinedAt: '2024-01-01T10:00:00Z',
    savedPosts: [],
    blockedUsers: [],
    postsCount: 2,
    helpCount: 1
  }
]

export const DEMO_POSTS = [
  // ====== NEARBY RIGHT NOW ======
  {
    id: 'post_1',
    type: 'right_now',
    userId: 'user_3',
    locality: 'Kharghar Sector 12',
    category: 'water',
    content: 'Pani nahi aa raha Sector 12 mein since morning. CIDCO ka koi update nahi. RO bhi khatam ho raha hai ghar mein.',
    createdAt: mins(45),
    expiresAt: hoursAhead(11),
    status: 'active',
    reportCount: 0,
    stillHappeningCount: 8,
    lastConfirmedAt: mins(5),
    confirmedBy: ['user_1', 'user_2', 'user_4', 'user_5']
  },
  {
    id: 'post_2',
    type: 'right_now',
    userId: 'user_1',
    locality: 'Palm Beach Road',
    category: 'traffic',
    content: 'Heavy traffic near Palm Beach Road entry point. Seems like an accident ahead. Avoid if possible — try Sion-Panvel Highway instead.',
    createdAt: mins(20),
    expiresAt: hoursAhead(6),
    status: 'active',
    reportCount: 0,
    stillHappeningCount: 5,
    lastConfirmedAt: mins(8),
    confirmedBy: ['user_2', 'user_5', 'user_3']
  },
  {
    id: 'post_3',
    type: 'right_now',
    userId: 'user_2',
    locality: 'Kharghar Sector 35',
    category: 'power',
    content: 'Light gaya Sector 35 mein. MSEDCL board ne kaha tha 3 PM tak aayega but still no power at 5:30 PM. Anyone else affected?',
    createdAt: hours(2),
    expiresAt: hoursAhead(10),
    status: 'active',
    reportCount: 0,
    stillHappeningCount: 12,
    lastConfirmedAt: mins(15),
    confirmedBy: ['user_1', 'user_4', 'user_5', 'user_3']
  },
  {
    id: 'post_4',
    type: 'right_now',
    userId: 'user_5',
    locality: 'Bandra Station',
    category: 'transport',
    content: 'Bandra station pe auto strike hai. No autos available from station to Linking Road. Better take rickshaw from Bandra East side.',
    createdAt: hours(1),
    expiresAt: hoursAhead(5),
    status: 'active',
    reportCount: 0,
    stillHappeningCount: 3,
    lastConfirmedAt: hours(1),
    confirmedBy: ['user_4']
  },
  {
    id: 'post_5',
    type: 'right_now',
    userId: 'user_4',
    locality: 'Linking Road, Bandra',
    category: 'police',
    content: 'Police checking on Linking Road near Shopper\'s Stop. Document checking hain. Keep RC, DL, insurance ready. Moving slowly.',
    createdAt: mins(90),
    expiresAt: hoursAhead(4),
    status: 'active',
    reportCount: 0,
    stillHappeningCount: 4,
    lastConfirmedAt: mins(30),
    confirmedBy: ['user_1', 'user_2']
  },
  {
    id: 'post_6',
    type: 'right_now',
    userId: 'user_3',
    locality: 'Nerul Sector 19',
    category: 'power',
    content: 'Nerul mein 3 hours se power cut chal rahi hai. Sector 19, 20, 21 sab affected hai. Backup generator bhi nahi chal raha society mein.',
    createdAt: hours(3),
    expiresAt: hoursAhead(9),
    status: 'active',
    reportCount: 0,
    stillHappeningCount: 6,
    lastConfirmedAt: hours(1),
    confirmedBy: ['user_1', 'user_2', 'user_5']
  },
  // ====== NEED IT NOW ======
  {
    id: 'post_7',
    type: 'need_it_now',
    userId: 'user_1',
    locality: 'Kharghar Sector 7',
    category: 'borrow',
    content: 'Drill machine chahiye 2 ghante ke liye. Wall drilling karna hai. Will return by evening. Sector 7, Kharghar mein aana pad sakta hai pickup ke liye.',
    createdAt: mins(30),
    expiresAt: daysAhead(1),
    status: 'active',
    reportCount: 0,
    neededBy: hoursAhead(4),
    distanceRange: '2km',
    helperCount: 1,
    isFulfilled: false
  },
  {
    id: 'post_8',
    type: 'need_it_now',
    userId: 'user_2',
    locality: 'Panvel',
    category: 'rideshare',
    content: 'Anyone going to Mumbai Airport (T2) tomorrow morning? 5:30 AM flight hai. Happy to split Ola/Uber fare. Starting from Panvel around 3:30 AM.',
    createdAt: hours(1),
    expiresAt: daysAhead(2),
    status: 'active',
    reportCount: 0,
    neededBy: daysAhead(1),
    distanceRange: '5km',
    helperCount: 0,
    isFulfilled: false
  },
  {
    id: 'post_9',
    type: 'need_it_now',
    userId: 'user_4',
    locality: 'Bandra West',
    category: 'borrow',
    content: 'Need Dell laptop charger (65W, Type-L plug) for 1 day. Mine got damaged. Can come pick it up in Bandra West area. Will return tomorrow.',
    createdAt: hours(2),
    expiresAt: daysAhead(1),
    status: 'active',
    reportCount: 0,
    neededBy: hoursAhead(6),
    distanceRange: '1km',
    helperCount: 0,
    isFulfilled: false
  },
  {
    id: 'post_10',
    type: 'need_it_now',
    userId: 'user_3',
    locality: 'Kharghar Sector 20',
    category: 'borrow',
    content: 'Need cricket bat for evening match today. Willow bat preferred, any size. 3–4 ghante ke liye chahiye. Sector 20 ground pe match hai 5 PM se.',
    createdAt: mins(60),
    expiresAt: hoursAhead(12),
    status: 'active',
    reportCount: 0,
    neededBy: hoursAhead(3),
    distanceRange: 'walking',
    helperCount: 2,
    isFulfilled: false
  },
  {
    id: 'post_11',
    type: 'need_it_now',
    userId: 'user_5',
    locality: 'Kharghar',
    category: 'ticket',
    content: 'Extra Coldplay Mumbai concert ticket available — Day 1. Face value only, no markup. Concert is this Saturday. DM if interested.',
    createdAt: hours(4),
    expiresAt: daysAhead(2),
    status: 'active',
    reportCount: 0,
    neededBy: daysAhead(3),
    distanceRange: '5km',
    helperCount: 3,
    isFulfilled: false
  }
]

export const DEMO_PROVIDERS = [
  {
    id: 'prov_1',
    name: 'Ramesh Bhai',
    serviceType: 'plumber',
    locality: 'Kharghar Sector 10',
    phone: '9876501001',
    whatsapp: '9876501001',
    recommendationCount: 5,
    notes: [
      'Fixed our bathroom leak same day, very honest about cost.',
      'Came on time and did clean work. Reasonable rates.',
      'Has proper tools, no shortcuts. Highly recommend.'
    ],
    isVerified: true,
    recommenderIds: ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'],
    createdAt: '2024-01-10T10:00:00Z',
    lastRecommendedAt: hours(48)
  },
  {
    id: 'prov_2',
    name: 'Sunita Tai',
    serviceType: 'cook',
    locality: 'Kharghar Sector 20',
    phone: '9876501002',
    whatsapp: '9876501002',
    recommendationCount: 4,
    notes: [
      'Makes excellent Maharashtrian food. Very reliable.',
      'Always on time, no excuses. Excellent hygiene.',
      'Been working with us for 2 years. Totally trustworthy.'
    ],
    isVerified: true,
    recommenderIds: ['user_1', 'user_3', 'user_4', 'user_5'],
    createdAt: '2024-01-12T10:00:00Z',
    lastRecommendedAt: hours(24)
  },
  {
    id: 'prov_3',
    name: 'Meena Bai',
    serviceType: 'maid',
    locality: 'Nerul Sector 25',
    phone: '9876501003',
    whatsapp: '9876501003',
    recommendationCount: 6,
    notes: [
      'Very trustworthy and honest. Works in our building for 3 years.',
      'Does thorough cleaning, never cuts corners.',
      'Available for part-time or full-time both.'
    ],
    isVerified: true,
    recommenderIds: ['user_1', 'user_2', 'user_3', 'user_4', 'user_5', 'admin_1'],
    createdAt: '2024-01-08T10:00:00Z',
    lastRecommendedAt: hours(12)
  },
  {
    id: 'prov_4',
    name: 'Suresh Sir',
    serviceType: 'tuition',
    locality: 'Kharghar Sector 7',
    phone: '9876501004',
    whatsapp: '9876501004',
    recommendationCount: 7,
    notes: [
      'Excellent teacher for Math and Science up to Class 10.',
      'My daughter\'s board marks went from 72% to 91% in one year.',
      'Very patient with slow learners. Highly recommended.'
    ],
    isVerified: true,
    recommenderIds: ['user_1', 'user_2', 'user_3', 'user_4', 'user_5', 'admin_1'],
    createdAt: '2024-01-05T10:00:00Z',
    lastRecommendedAt: hours(6)
  },
  {
    id: 'prov_5',
    name: 'Raju Electrician',
    serviceType: 'electrician',
    locality: 'Ulwe Sector 3',
    phone: '9876501005',
    whatsapp: '9876501005',
    recommendationCount: 3,
    notes: [
      'Fixed our inverter wiring professionally. Good work.',
      'Responds quickly on WhatsApp. Comes same day.',
      'Reasonable rates and knows his stuff.'
    ],
    isVerified: true,
    recommenderIds: ['user_2', 'user_3', 'user_5'],
    createdAt: '2024-02-01T10:00:00Z',
    lastRecommendedAt: hours(36)
  },
  {
    id: 'prov_6',
    name: 'Deepa (Dog Walker)',
    serviceType: 'dog_walker',
    locality: 'Kharghar Sector 12',
    phone: '9876501006',
    whatsapp: '9876501006',
    recommendationCount: 2,
    notes: [
      'Very good with dogs, my Labrador loves her.',
      'Reliable and on time. Morning and evening walks.'
    ],
    isVerified: false,
    recommenderIds: ['user_1', 'user_2'],
    createdAt: '2024-02-15T10:00:00Z',
    lastRecommendedAt: hours(72)
  },
  {
    id: 'prov_7',
    name: 'Kiran Carpenter',
    serviceType: 'carpenter',
    locality: 'Kamothe Sector 4',
    phone: '9876501007',
    whatsapp: '9876501007',
    recommendationCount: 4,
    notes: [
      'Excellent woodwork. Made custom wardrobe for our room.',
      'Neat finishing, no wastage. Honest quotation.',
      'Completed on time, no excuses.'
    ],
    isVerified: true,
    recommenderIds: ['user_1', 'user_3', 'user_4', 'user_5'],
    createdAt: '2024-01-20T10:00:00Z',
    lastRecommendedAt: hours(20)
  }
]

export const DEMO_REPLIES = [
  {
    id: 'reply_1',
    postId: 'post_1',
    userId: 'user_2',
    content: 'Haan, same problem in Sector 11 also. Called CIDCO helpline but no answer.',
    replyType: 'custom',
    createdAt: mins(40)
  },
  {
    id: 'reply_2',
    postId: 'post_1',
    userId: 'user_5',
    content: 'Still happening! No water since 8 AM.',
    replyType: 'still_happening',
    createdAt: mins(20)
  },
  {
    id: 'reply_3',
    postId: 'post_1',
    userId: 'user_3',
    content: 'Neighbor told me CIDCO said water will come by 4 PM. Let\'s see.',
    replyType: 'custom',
    createdAt: mins(15)
  },
  {
    id: 'reply_4',
    postId: 'post_2',
    userId: 'user_3',
    content: 'Still happening near Seawoods signal also.',
    replyType: 'still_happening',
    createdAt: mins(10)
  },
  {
    id: 'reply_5',
    postId: 'post_7',
    userId: 'user_2',
    content: 'I have one! Come to A-wing Sector 7 or I can drop at your place.',
    replyType: 'i_can_help',
    createdAt: mins(20)
  },
  {
    id: 'reply_6',
    postId: 'post_10',
    userId: 'user_1',
    content: 'Have a bat, will bring to Sector 20 ground by 5 PM.',
    replyType: 'i_can_help',
    createdAt: mins(45)
  },
  {
    id: 'reply_7',
    postId: 'post_10',
    userId: 'user_4',
    content: 'I also have one if the first offer doesn\'t work out.',
    replyType: 'i_can_help',
    createdAt: mins(30)
  },
  {
    id: 'reply_8',
    postId: 'post_11',
    userId: 'user_1',
    content: 'Interested! What is the face value? DM karo.',
    replyType: 'custom',
    createdAt: hours(3)
  },
  {
    id: 'reply_9',
    postId: 'post_3',
    userId: 'user_4',
    content: 'Sector 35 B wing bhi affected hai. Still no power.',
    replyType: 'still_happening',
    createdAt: hours(1)
  }
]

export const DEMO_REPORTS = [
  {
    id: 'report_1',
    reporterId: 'user_2',
    targetType: 'post',
    targetId: 'post_4',
    reason: 'false_info',
    createdAt: hours(2),
    status: 'pending',
    reporterNote: 'Auto strike ended 2 hours ago, this is outdated.'
  }
]

export const LOCALITIES = [
  { id: 'kharghar_s1', name: 'Kharghar Sector 1–5', area: 'Kharghar, Navi Mumbai' },
  { id: 'kharghar_s2', name: 'Kharghar Sector 6–12', area: 'Kharghar, Navi Mumbai' },
  { id: 'kharghar_s3', name: 'Kharghar Sector 13–20', area: 'Kharghar, Navi Mumbai' },
  { id: 'kharghar_s4', name: 'Kharghar Sector 21–36', area: 'Kharghar, Navi Mumbai' },
  { id: 'kamothe', name: 'Kamothe', area: 'Navi Mumbai' },
  { id: 'nerul', name: 'Nerul', area: 'Navi Mumbai' },
  { id: 'ulwe', name: 'Ulwe', area: 'Navi Mumbai' },
  { id: 'panvel', name: 'Panvel', area: 'Navi Mumbai' },
  { id: 'bandra_w', name: 'Bandra West', area: 'Mumbai' },
  { id: 'bandra_e', name: 'Bandra East', area: 'Mumbai' },
  { id: 'powai', name: 'Powai', area: 'Mumbai' }
]

export const CATEGORY_META = {
  // Right Now
  traffic: { label: 'Traffic', icon: '🚗', expiry: 6 },
  transport: { label: 'Transport', icon: '🚌', expiry: 6 },
  police: { label: 'Police', icon: '🚔', expiry: 6 },
  water: { label: 'Water Issue', icon: '💧', expiry: 12 },
  power: { label: 'Power Cut', icon: '⚡', expiry: 12 },
  weather: { label: 'Weather', icon: '🌧️', expiry: 6 },
  safety: { label: 'Safety', icon: '🚨', expiry: 12 },
  civic: { label: 'Civic Issue', icon: '🏗️', expiry: 12 },
  // Need It Now
  borrow: { label: 'Borrow / Lend', icon: '🤝', expiry: 24 },
  rideshare: { label: 'Ride Share', icon: '🚕', expiry: 48 },
  urgent: { label: 'Urgent Help', icon: '🆘', expiry: 24 },
  ticket: { label: 'Spare Ticket', icon: '🎟️', expiry: 48 },
  errand: { label: 'Local Errand', icon: '📦', expiry: 24 },
}

export const SERVICE_TYPES = [
  { id: 'cook', label: 'Cook', icon: '👨‍🍳' },
  { id: 'maid', label: 'Maid', icon: '🏠' },
  { id: 'tuition', label: 'Tuition Teacher', icon: '📚' },
  { id: 'dog_walker', label: 'Dog Walker', icon: '🐕' },
  { id: 'plumber', label: 'Plumber', icon: '🔧' },
  { id: 'electrician', label: 'Electrician', icon: '⚡' },
  { id: 'carpenter', label: 'Carpenter', icon: '🪚' },
  { id: 'driver', label: 'Driver', icon: '🚗' },
  { id: 'babysitter', label: 'Babysitter', icon: '👶' },
  { id: 'home_nurse', label: 'Home Nurse', icon: '🏥' },
]
