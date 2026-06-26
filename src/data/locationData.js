// ─────────────────────────────────────────────────────────────────────────────
// src/data/locationData.js
// Pan-India location hierarchy: State → City → Localities
// Used by the onboarding selector, AppContext, and demo data seeding.
// ─────────────────────────────────────────────────────────────────────────────

export const INDIA_LOCATIONS = [
  {
    state: 'Maharashtra',
    stateSlug: 'maharashtra',
    cities: [
      {
        city: 'Mumbai',
        citySlug: 'mumbai',
        localities: [
          { name: 'Bandra West',       slug: 'bandra-west',       pincode: '400050' },
          { name: 'Bandra East',        slug: 'bandra-east',        pincode: '400051' },
          { name: 'Andheri West',       slug: 'andheri-west',       pincode: '400058' },
          { name: 'Andheri East',       slug: 'andheri-east',       pincode: '400069' },
          { name: 'Powai',              slug: 'powai',              pincode: '400076' },
          { name: 'Malad West',         slug: 'malad-west',         pincode: '400064' },
          { name: 'Borivali West',      slug: 'borivali-west',      pincode: '400092' },
          { name: 'Dadar',              slug: 'dadar',              pincode: '400014' },
          { name: 'Worli',              slug: 'worli',              pincode: '400018' },
        ]
      },
      {
        city: 'Navi Mumbai',
        citySlug: 'navi-mumbai',
        localities: [
          { name: 'Kharghar',           slug: 'kharghar',           pincode: '410210' },
          { name: 'Nerul',              slug: 'nerul',              pincode: '400706' },
          { name: 'Ulwe',               slug: 'ulwe',               pincode: '410206' },
          { name: 'Kamothe',            slug: 'kamothe',            pincode: '410209' },
          { name: 'Panvel',             slug: 'panvel',             pincode: '410206' },
          { name: 'Vashi',              slug: 'vashi',              pincode: '400703' },
          { name: 'Belapur',            slug: 'belapur',            pincode: '400614' },
          { name: 'Airoli',             slug: 'airoli',             pincode: '400708' },
        ]
      },
      {
        city: 'Pune',
        citySlug: 'pune',
        localities: [
          { name: 'Koregaon Park',      slug: 'koregaon-park',      pincode: '411001' },
          { name: 'Viman Nagar',        slug: 'viman-nagar',        pincode: '411014' },
          { name: 'Baner',              slug: 'baner',              pincode: '411045' },
          { name: 'Kharadi',            slug: 'kharadi',            pincode: '411014' },
          { name: 'Hinjewadi',          slug: 'hinjewadi',          pincode: '411057' },
          { name: 'Wakad',              slug: 'wakad',              pincode: '411057' },
          { name: 'Hadapsar',           slug: 'hadapsar',           pincode: '411028' },
          { name: 'Aundh',              slug: 'aundh',              pincode: '411007' },
        ]
      },
    ]
  },
  {
    state: 'Karnataka',
    stateSlug: 'karnataka',
    cities: [
      {
        city: 'Bengaluru',
        citySlug: 'bengaluru',
        localities: [
          { name: 'Whitefield',         slug: 'whitefield',         pincode: '560066' },
          { name: 'Koramangala',        slug: 'koramangala',        pincode: '560034' },
          { name: 'Indiranagar',        slug: 'indiranagar',        pincode: '560038' },
          { name: 'HSR Layout',         slug: 'hsr-layout',         pincode: '560102' },
          { name: 'Electronic City',    slug: 'electronic-city',    pincode: '560100' },
          { name: 'Bellandur',          slug: 'bellandur',          pincode: '560103' },
          { name: 'Sarjapur Road',      slug: 'sarjapur-road',      pincode: '560035' },
          { name: 'Jayanagar',          slug: 'jayanagar',          pincode: '560011' },
          { name: 'BTM Layout',         slug: 'btm-layout',         pincode: '560076' },
        ]
      },
      {
        city: 'Mysuru',
        citySlug: 'mysuru',
        localities: [
          { name: 'Vijayanagar',        slug: 'vijayanagar',        pincode: '570017' },
          { name: 'Kuvempunagar',       slug: 'kuvempunagar',       pincode: '570023' },
          { name: 'Saraswathipuram',    slug: 'saraswathipuram',    pincode: '570009' },
        ]
      }
    ]
  },
  {
    state: 'Delhi NCR',
    stateSlug: 'delhi-ncr',
    cities: [
      {
        city: 'New Delhi',
        citySlug: 'new-delhi',
        localities: [
          { name: 'Saket',              slug: 'saket',              pincode: '110017' },
          { name: 'Dwarka Sector 10',   slug: 'dwarka-sector-10',   pincode: '110075' },
          { name: 'Rohini',             slug: 'rohini',             pincode: '110085' },
          { name: 'Lajpat Nagar',       slug: 'lajpat-nagar',       pincode: '110024' },
          { name: 'Vasant Kunj',        slug: 'vasant-kunj',        pincode: '110070' },
          { name: 'Mayur Vihar',        slug: 'mayur-vihar',        pincode: '110091' },
        ]
      },
      {
        city: 'Gurgaon',
        citySlug: 'gurgaon',
        localities: [
          { name: 'Sector 56',          slug: 'sector-56',          pincode: '122011' },
          { name: 'DLF Phase 4',        slug: 'dlf-phase-4',        pincode: '122009' },
          { name: 'Sohna Road',         slug: 'sohna-road',         pincode: '122018' },
          { name: 'Golf Course Road',   slug: 'golf-course-road',   pincode: '122002' },
          { name: 'Palam Vihar',        slug: 'palam-vihar',        pincode: '122017' },
        ]
      },
      {
        city: 'Noida',
        citySlug: 'noida',
        localities: [
          { name: 'Sector 18',          slug: 'sector-18',          pincode: '201301' },
          { name: 'Sector 62',          slug: 'sector-62',          pincode: '201301' },
          { name: 'Sector 137',         slug: 'sector-137',         pincode: '201304' },
          { name: 'Sector 150',         slug: 'sector-150',         pincode: '201310' },
        ]
      }
    ]
  },
  {
    state: 'Telangana',
    stateSlug: 'telangana',
    cities: [
      {
        city: 'Hyderabad',
        citySlug: 'hyderabad',
        localities: [
          { name: 'Gachibowli',         slug: 'gachibowli',         pincode: '500032' },
          { name: 'Kondapur',           slug: 'kondapur',           pincode: '500084' },
          { name: 'Madhapur',           slug: 'madhapur',           pincode: '500081' },
          { name: 'Banjara Hills',      slug: 'banjara-hills',      pincode: '500034' },
          { name: 'Jubilee Hills',      slug: 'jubilee-hills',      pincode: '500033' },
          { name: 'Kukatpally',         slug: 'kukatpally',         pincode: '500072' },
          { name: 'Manikonda',          slug: 'manikonda',          pincode: '500089' },
        ]
      }
    ]
  },
  {
    state: 'Tamil Nadu',
    stateSlug: 'tamil-nadu',
    cities: [
      {
        city: 'Chennai',
        citySlug: 'chennai',
        localities: [
          { name: 'Anna Nagar',         slug: 'anna-nagar',         pincode: '600040' },
          { name: 'Adyar',              slug: 'adyar',              pincode: '600020' },
          { name: 'Velachery',          slug: 'velachery',          pincode: '600042' },
          { name: 'T. Nagar',           slug: 't-nagar',            pincode: '600017' },
          { name: 'OMR',                slug: 'omr',                pincode: '600119' },
          { name: 'Porur',              slug: 'porur',              pincode: '600116' },
        ]
      }
    ]
  },
  {
    state: 'Gujarat',
    stateSlug: 'gujarat',
    cities: [
      {
        city: 'Ahmedabad',
        citySlug: 'ahmedabad',
        localities: [
          { name: 'Satellite',          slug: 'satellite',          pincode: '380015' },
          { name: 'Bopal',              slug: 'bopal',              pincode: '380058' },
          { name: 'Prahlad Nagar',      slug: 'prahlad-nagar',      pincode: '380015' },
          { name: 'Thaltej',            slug: 'thaltej',            pincode: '380054' },
          { name: 'SG Highway',         slug: 'sg-highway',         pincode: '380060' },
        ]
      },
      {
        city: 'Surat',
        citySlug: 'surat',
        localities: [
          { name: 'Adajan',             slug: 'adajan',             pincode: '395009' },
          { name: 'Vesu',               slug: 'vesu',               pincode: '395007' },
          { name: 'Piplod',             slug: 'piplod',             pincode: '395007' },
        ]
      }
    ]
  },
  {
    state: 'Rajasthan',
    stateSlug: 'rajasthan',
    cities: [
      {
        city: 'Jaipur',
        citySlug: 'jaipur',
        localities: [
          { name: 'Vaishali Nagar',     slug: 'vaishali-nagar',     pincode: '302021' },
          { name: 'Mansarovar',         slug: 'mansarovar',         pincode: '302020' },
          { name: 'Malviya Nagar',      slug: 'malviya-nagar',      pincode: '302017' },
          { name: 'C Scheme',           slug: 'c-scheme',           pincode: '302001' },
        ]
      }
    ]
  },
  {
    state: 'Uttar Pradesh',
    stateSlug: 'uttar-pradesh',
    cities: [
      {
        city: 'Lucknow',
        citySlug: 'lucknow',
        localities: [
          { name: 'Gomti Nagar',        slug: 'gomti-nagar',        pincode: '226010' },
          { name: 'Hazratganj',         slug: 'hazratganj',         pincode: '226001' },
          { name: 'Aliganj',            slug: 'aliganj',            pincode: '226024' },
          { name: 'Indira Nagar',       slug: 'indira-nagar-lko',   pincode: '226016' },
        ]
      },
      {
        city: 'Agra',
        citySlug: 'agra',
        localities: [
          { name: 'Kamla Nagar',        slug: 'kamla-nagar-agra',   pincode: '282005' },
          { name: 'Dayal Bagh',         slug: 'dayal-bagh',         pincode: '282005' },
        ]
      }
    ]
  },
  {
    state: 'West Bengal',
    stateSlug: 'west-bengal',
    cities: [
      {
        city: 'Kolkata',
        citySlug: 'kolkata',
        localities: [
          { name: 'Salt Lake',          slug: 'salt-lake',          pincode: '700091' },
          { name: 'New Town',           slug: 'new-town',           pincode: '700156' },
          { name: 'Ballygunge',         slug: 'ballygunge',         pincode: '700019' },
          { name: 'Behala',             slug: 'behala',             pincode: '700060' },
        ]
      }
    ]
  },
  {
    state: 'Kerala',
    stateSlug: 'kerala',
    cities: [
      {
        city: 'Kochi',
        citySlug: 'kochi',
        localities: [
          { name: 'Kakkanad',           slug: 'kakkanad',           pincode: '682030' },
          { name: 'Edappally',          slug: 'edappally',          pincode: '682024' },
          { name: 'Thrippunithura',     slug: 'thrippunithura',     pincode: '682301' },
          { name: 'Marine Drive',       slug: 'marine-drive',       pincode: '682031' },
        ]
      }
    ]
  },
]

// ── Flat list of all localities (for search / fast lookup) ────────────────────
export const ALL_LOCALITIES = INDIA_LOCATIONS.flatMap(s =>
  s.cities.flatMap(c =>
    c.localities.map(l => ({
      id: `${s.stateSlug}__${c.citySlug}__${l.slug}`,
      locality: l.name,
      localitySlug: l.slug,
      city: c.city,
      citySlug: c.citySlug,
      state: s.state,
      stateSlug: s.stateSlug,
      pincode: l.pincode,
      label: `${l.name}, ${c.city}`,
      fullLabel: `${l.name}, ${c.city}, ${s.state}`,
    }))
  )
)

// ── Helper: find a locality object by name string ─────────────────────────────
export function findLocality(name) {
  if (!name) return null
  const q = name.toLowerCase()
  return ALL_LOCALITIES.find(
    l => l.locality.toLowerCase() === q || l.label.toLowerCase() === q
  ) || null
}

/** Resolve /:localitySlug/need-to-buy → { locality, label, city } */
export function findLocalityBySlug(slug) {
  if (!slug) return null
  const q = slug.toLowerCase()
  return ALL_LOCALITIES.find(l => l.localitySlug === q) || null
}

// ── Helper: get cities for a state ───────────────────────────────────────────
export function getCitiesForState(stateSlug) {
  const s = INDIA_LOCATIONS.find(s => s.stateSlug === stateSlug)
  return s ? s.cities : []
}

// ── Helper: get localities for a city ────────────────────────────────────────
export function getLocalitiesForCity(stateSlug, citySlug) {
  const s = INDIA_LOCATIONS.find(s => s.stateSlug === stateSlug)
  if (!s) return []
  const c = s.cities.find(c => c.citySlug === citySlug)
  return c ? c.localities : []
}

// ── Legacy LOCALITIES list (used as fallback in existing screens) ─────────────
export const LOCALITIES = ALL_LOCALITIES.map(l => l.label)
