import { IssueCategory, UserLocation } from "../types";

export interface DepartmentContact {
  name: string;
  phone: string;
  emergencyPhone?: string;
  email: string;
  website: string;
  office: string;
  hours: string;
  responseTime: string;
}

export interface EmergencyContact {
  id: string;
  category: "Police" | "Medical" | "Fire" | "Electricity" | "Water" | "Civic";
  name: string;
  phone: string;
  email: string;
  website: string;
  office: string;
  hours: string;
  latitude: number;
  longitude: number;
}

// Haversine formula to calculate distance in km
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export function detectAuthority(
  category: IssueCategory,
  location: UserLocation | null,
  title?: string,
  description?: string
): DepartmentContact {
  const city = (location?.city || "Jaipur").trim();
  const state = (location?.state || "Rajasthan").trim();
  const lowerCity = city.toLowerCase();

  const titleLower = (title || "").toLowerCase();
  const descLower = (description || "").toLowerCase();
  
  // Decide if it's a water supply issue vs engineering (drainage/manhole/water main)
  const isDrainageOrManhole =
    titleLower.includes("drain") ||
    descLower.includes("drain") ||
    titleLower.includes("manhole") ||
    descLower.includes("manhole") ||
    titleLower.includes("sewer") ||
    descLower.includes("sewer");

  const isDumping =
    titleLower.includes("dump") ||
    descLower.includes("dump") ||
    titleLower.includes("garbage") ||
    descLower.includes("garbage") ||
    titleLower.includes("trash") ||
    descLower.includes("trash");

  // Localized Contact Config
  if (lowerCity.includes("jaipur")) {
    if (category === "Roads/Potholes") {
      return {
        name: "Rajasthan Public Works Department (PWD)",
        phone: "+91-141-2227111",
        emergencyPhone: "+91-141-2227112",
        email: "pwd-cell-rj@nic.in",
        website: "https://pwd.rajasthan.gov.in",
        office: "PWD Headquarters, Jacob Road, Civil Lines, Jaipur, RJ 302006",
        hours: "9:30 AM - 6:00 PM (Mon-Sat)",
        responseTime: "48 Hours"
      };
    } else if (category === "Streetlights") {
      return {
        name: "Jaipur Vidyut Vitran Nigam Limited (JVVNL)",
        phone: "+91-141-2203000",
        emergencyPhone: "1800-180-6127",
        email: "streetlight.jvvnl@rvpn.co.in",
        website: "https://energy.rajasthan.gov.in/jvvnl",
        office: "Vidyut Bhawan, Jyoti Nagar, Janpath, Jaipur, RJ 302005",
        hours: "24/7 Helpline • Office: 10:00 AM - 5:00 PM",
        responseTime: "24 Hours"
      };
    } else if (category === "Water/Sanitation" && isDrainageOrManhole) {
      return {
        name: "Jaipur Municipal Corporation (JMC) Civil Engineering Division",
        phone: "+91-141-2742800",
        emergencyPhone: "+91-141-2741424",
        email: "jmc-engineering@rajasthan.gov.in",
        website: "https://jaipurmc.org",
        office: "JMC Greater Office, Lal Kothi, Tonk Road, Jaipur, RJ 302015",
        hours: "10:00 AM - 5:30 PM (Mon-Sat)",
        responseTime: "36 Hours"
      };
    } else if (category === "Water/Sanitation") {
      return {
        name: "Rajasthan Public Health Engineering Department (PHED)",
        phone: "+91-141-2222340",
        emergencyPhone: "+91-141-2224555",
        email: "phed.jaipur@rajasthan.gov.in",
        website: "https://phedwater.rajasthan.gov.in",
        office: "Jal Bhawan, Civil Lines, Jaipur, RJ 302006",
        hours: "9:30 AM - 6:00 PM (Mon-Sat)",
        responseTime: "24 Hours"
      };
    } else if (category === "Trash/Litter" || isDumping) {
      return {
        name: "JMC Sanitation & Garbage Management Wing",
        phone: "+91-141-2741088",
        emergencyPhone: "+91-141-2741000",
        email: "swm.jmc@rajasthan.gov.in",
        website: "https://jaipurmc.org",
        office: "JMC Building, Pt. Deendayal Upadhyay Bhawan, Tonk Road, Jaipur, RJ 302015",
        hours: "8:00 AM - 4:00 PM (Daily)",
        responseTime: "12 Hours"
      };
    } else {
      return {
        name: "Jaipur Municipal Corporation (JMC)",
        phone: "+91-141-2741424",
        email: "support.jmc@rajasthan.gov.in",
        website: "https://jaipurmc.org",
        office: "Pt. Deendayal Upadhyay Bhawan, Lal Kothi, Jaipur, RJ 302015",
        hours: "9:30 AM - 6:00 PM (Mon-Sat)",
        responseTime: "72 Hours"
      };
    }
  }

  if (lowerCity.includes("bengaluru") || lowerCity.includes("bangalore")) {
    if (category === "Roads/Potholes") {
      return {
        name: "Bruhat Bengaluru Mahanagara Palike (BBMP) Infrastructure Wing",
        phone: "+91-80-22221188",
        emergencyPhone: "+91-80-22660000",
        email: "comm@bbmp.gov.in",
        website: "https://bbmp.gov.in",
        office: "BBMP Head Office, Hudson Circle, Bengaluru, KA 560002",
        hours: "10:00 AM - 5:30 PM (Mon-Sat)",
        responseTime: "36 Hours"
      };
    } else if (category === "Streetlights") {
      return {
        name: "Bangalore Electricity Supply Company (BESCOM)",
        phone: "+91-80-22873333",
        emergencyPhone: "1912",
        email: "helpline@bescom.co.in",
        website: "https://bescom.karnataka.gov.in",
        office: "BESCOM Corporate Office, K.R. Circle, Bengaluru, KA 560001",
        hours: "24/7 Helpline • Office: 10:00 AM - 5:30 PM",
        responseTime: "12 Hours"
      };
    } else if (category === "Water/Sanitation" && isDrainageOrManhole) {
      return {
        name: "BBMP Storm Water Drains & Engineering Wing",
        phone: "+91-80-22975513",
        emergencyPhone: "+91-80-22975500",
        email: "ce.swd@bbmp.gov.in",
        website: "https://bbmp.gov.in",
        office: "BBMP Annex Building, Corporation Circle, Bengaluru, KA 560002",
        hours: "10:00 AM - 5:30 PM (Mon-Sat)",
        responseTime: "24 Hours"
      };
    } else if (category === "Water/Sanitation") {
      return {
        name: "Bangalore Water Supply and Sewerage Board (BWSSB)",
        phone: "+91-80-22238888",
        emergencyPhone: "1916",
        email: "callcenter@bwssb.gov.in",
        website: "https://bwssb.karnataka.gov.in",
        office: "Cauvery Bhawan, K.G. Road, Bengaluru, KA 560009",
        hours: "24/7 Helpline • Office: 10:00 AM - 5:30 PM",
        responseTime: "24 Hours"
      };
    } else if (category === "Trash/Litter" || isDumping) {
      return {
        name: "BBMP Solid Waste Management Division",
        phone: "+91-80-22485307",
        emergencyPhone: "+91-80-22660000",
        email: "jcsgwm@bbmp.gov.in",
        website: "https://bbmp.gov.in",
        office: "N.R. Square, BBMP Head Office, Bengaluru, KA 560002",
        hours: "7:00 AM - 3:00 PM (Daily)",
        responseTime: "12 Hours"
      };
    } else {
      return {
        name: "Bruhat Bengaluru Mahanagara Palike (BBMP)",
        phone: "+91-80-22660000",
        email: "contactus@bbmp.gov.in",
        website: "https://bbmp.gov.in",
        office: "Hudson Circle, Corporation Office, Bengaluru, KA 560002",
        hours: "10:00 AM - 5:30 PM (Mon-Sat)",
        responseTime: "48 Hours"
      };
    }
  }

  if (lowerCity.includes("mumbai")) {
    if (category === "Roads/Potholes") {
      return {
        name: "Municipal Corporation of Greater Mumbai (MCGM / BMC) Roads Dept",
        phone: "+91-22-22620251",
        emergencyPhone: "+91-22-22694727",
        email: "mcgmroads@gov.in",
        website: "https://portal.mcgm.gov.in",
        office: "BMC Head Office, Mahapalika Marg, Fort, Mumbai, MH 400001",
        hours: "10:00 AM - 6:00 PM (Mon-Sat)",
        responseTime: "24 Hours"
      };
    } else if (category === "Streetlights") {
      return {
        name: "Maharashtra State Electricity Distribution Co. (MSEDCL)",
        phone: "+91-22-26474211",
        emergencyPhone: "1912",
        email: "customercare@mahadiscom.in",
        website: "https://www.mahadiscom.in",
        office: "Prakashgad, Plot No. G-9, Bandra (East), Mumbai, MH 400051",
        hours: "24/7 Helpline • Office: 10:00 AM - 5:30 PM",
        responseTime: "18 Hours"
      };
    } else if (category === "Water/Sanitation" && isDrainageOrManhole) {
      return {
        name: "BMC Storm Water Drains & Civil Engineering Division",
        phone: "+91-22-22620251",
        emergencyPhone: "1916",
        email: "ce.swd@mcgm.gov.in",
        website: "https://portal.mcgm.gov.in",
        office: "Municipal Annex Building, Mahapalika Marg, Fort, Mumbai, MH 400001",
        hours: "9:30 AM - 6:00 PM (Mon-Sat)",
        responseTime: "24 Hours"
      };
    } else if (category === "Water/Sanitation") {
      return {
        name: "BMC Hydraulic Engineering Department",
        phone: "+91-22-22620251",
        emergencyPhone: "1916",
        email: "hydraulic.engg@mcgm.gov.in",
        website: "https://portal.mcgm.gov.in",
        office: "BMC Water Office, G-South Ward, Elphinstone Road, Mumbai, MH 400013",
        hours: "10:00 AM - 5:30 PM (Mon-Sat)",
        responseTime: "24 Hours"
      };
    } else if (category === "Trash/Litter" || isDumping) {
      return {
        name: "BMC Solid Waste Management Wing",
        phone: "+91-22-22624000",
        emergencyPhone: "+91-22-22694727",
        email: "dyche.swm@mcgm.gov.in",
        website: "https://portal.mcgm.gov.in",
        office: "SWM Office, Worli Garage, Love Grove, Worli, Mumbai, MH 400018",
        hours: "7:00 AM - 4:00 PM (Daily)",
        responseTime: "12 Hours"
      };
    } else {
      return {
        name: "Municipal Corporation of Greater Mumbai (MCGM / BMC)",
        phone: "1916",
        email: "citizenportal@mcgm.gov.in",
        website: "https://portal.mcgm.gov.in",
        office: "Mahapalika Marg, Fort, Mumbai, MH 400001",
        hours: "9:30 AM - 6:00 PM (Mon-Sat)",
        responseTime: "48 Hours"
      };
    }
  }

  if (lowerCity.includes("delhi")) {
    if (category === "Roads/Potholes") {
      return {
        name: "Delhi Public Works Department (PWD)",
        phone: "1800-11-0093",
        emergencyPhone: "+91-11-23490323",
        email: "pwd-delhi@nic.in",
        website: "https://pwd.delhi.gov.in",
        office: "PWD Headquarters, 12th Floor, MSO Building, I.P. Estate, New Delhi 110002",
        hours: "9:30 AM - 6:00 PM (Mon-Sat)",
        responseTime: "36 Hours"
      };
    } else if (category === "Streetlights") {
      return {
        name: "BSES Rajdhani & Yamuna Power Limited",
        phone: "+91-11-39999707",
        emergencyPhone: "19122",
        email: "bses.streetlight@relianceada.com",
        website: "https://www.bsesdelhi.com",
        office: "BSES Bhawan, Nehru Place, New Delhi 110019",
        hours: "24/7 Helpline • Office: 10:00 AM - 5:00 PM",
        responseTime: "24 Hours"
      };
    } else if (category === "Water/Sanitation" && isDrainageOrManhole) {
      return {
        name: "Municipal Corporation of Delhi (MCD) Civil Engineering Dept",
        phone: "+91-11-23228100",
        emergencyPhone: "155305",
        email: "mcd-civil@mcd.nic.in",
        website: "https://mcdonline.nic.in",
        office: "Civic Centre, Minto Road, New Delhi 110002",
        hours: "10:00 AM - 5:30 PM (Mon-Sat)",
        responseTime: "24 Hours"
      };
    } else if (category === "Water/Sanitation") {
      return {
        name: "Delhi Jal Board (DJB)",
        phone: "+91-11-23516340",
        emergencyPhone: "1916",
        email: "djbcallcenter@gmail.com",
        website: "https://delhijalboard.nic.in",
        office: "Varunalaya Phase-II, Jhandewalan, New Delhi 110005",
        hours: "24/7 Helpline • Office: 10:00 AM - 5:30 PM",
        responseTime: "24 Hours"
      };
    } else if (category === "Trash/Litter" || isDumping) {
      return {
        name: "MCD Sanitation & Conservancy Department",
        phone: "+91-11-23225355",
        emergencyPhone: "155305",
        email: "mcd-sanitation@mcd.nic.in",
        website: "https://mcdonline.nic.in",
        office: "MCD Civic Center, Ward Division, New Delhi 110002",
        hours: "7:00 AM - 3:30 PM (Daily)",
        responseTime: "12 Hours"
      };
    } else {
      return {
        name: "Municipal Corporation of Delhi (MCD)",
        phone: "155305",
        email: "feedback.mcd@mcd.nic.in",
        website: "https://mcdonline.nic.in",
        office: "Dr. S.P. Mukherjee Civic Centre, J.L.N. Marg, New Delhi 110002",
        hours: "9:30 AM - 6:00 PM (Mon-Sat)",
        responseTime: "48 Hours"
      };
    }
  }

  if (lowerCity.includes("san francisco") || lowerCity.includes("francisco")) {
    if (category === "Roads/Potholes") {
      return {
        name: "San Francisco Public Works (SFPW) Street Maintenance Division",
        phone: "311",
        emergencyPhone: "+1-415-701-2311",
        email: "dpw@sfdpw.org",
        website: "https://sfpublicworks.org",
        office: "2323 Cesar Chavez Street, San Francisco, CA 94124",
        hours: "8:00 AM - 5:00 PM (Mon-Fri)",
        responseTime: "24 Hours"
      };
    } else if (category === "Streetlights") {
      return {
        name: "Pacific Gas and Electric Company (PG&E) / SF PUC Power",
        phone: "+1-800-743-5000",
        emergencyPhone: "+1-800-743-5002",
        email: "streetlight.reports@pge.com",
        website: "https://www.pge.com",
        office: "77 Beale St, San Francisco, CA 94105",
        hours: "24/7 Hotline • Office: 9:00 AM - 5:00 PM",
        responseTime: "24 Hours"
      };
    } else if (category === "Water/Sanitation" && isDrainageOrManhole) {
      return {
        name: "San Francisco Public Utilities Commission (SFPUC) Wastewater Enterprise",
        phone: "+1-415-551-3000",
        emergencyPhone: "311",
        email: "wastewaterinfo@sfwater.org",
        website: "https://sfpuc.org",
        office: "525 Golden Gate Ave, San Francisco, CA 94102",
        hours: "8:00 AM - 5:00 PM (Mon-Fri)",
        responseTime: "12 Hours"
      };
    } else if (category === "Water/Sanitation") {
      return {
        name: "San Francisco Public Utilities Commission (SFPUC) Water Dept",
        phone: "+1-415-551-3000",
        emergencyPhone: "+1-415-550-4911",
        email: "watercustomerservice@sfwater.org",
        website: "https://sfpuc.org",
        office: "525 Golden Gate Ave, San Francisco, CA 94102",
        hours: "8:00 AM - 5:00 PM (Mon-Fri)",
        responseTime: "24 Hours"
      };
    } else if (category === "Trash/Litter" || isDumping) {
      return {
        name: "SF Public Works Bureau of Sanitation",
        phone: "311",
        emergencyPhone: "+1-415-701-2311",
        email: "sanitation.dpw@sfdpw.org",
        website: "https://sfpublicworks.org",
        office: "1155 Market St, San Francisco, CA 94103",
        hours: "7:00 AM - 5:00 PM (Daily)",
        responseTime: "8 Hours"
      };
    } else {
      return {
        name: "SF 311 Customer Service Center",
        phone: "311",
        email: "sf311@sfgov.org",
        website: "https://sf311.org",
        office: "City Hall Room 311, 1 Dr. Carlton B. Goodlett Pl, San Francisco, CA 94102",
        hours: "24/7 Operations",
        responseTime: "48 Hours"
      };
    }
  }

  // Fallback / General lookup for any other detected city/municipality
  const displayCity = city || "Local";
  const displayState = state || "State";
  
  if (category === "Roads/Potholes") {
    return {
      name: `${displayCity} Public Works Department (PWD)`,
      phone: "+91-555-0199-ROAD",
      emergencyPhone: "+91-555-0100-EMER",
      email: `pwd-complaints@${displayCity.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      website: `https://${displayCity.toLowerCase().replace(/\s+/g, "")}-pwd.gov.in`,
      office: `${displayCity} Municipal PWD Office, Main Circle Road, ${displayCity}, ${displayState}`,
      hours: "9:30 AM - 5:30 PM (Mon-Sat)",
      responseTime: "48 Hours"
    };
  } else if (category === "Streetlights") {
    return {
      name: `${displayCity} Electricity Distribution Board`,
      phone: "+91-555-0177-ELEC",
      emergencyPhone: "1912",
      email: `electrical@${displayCity.toLowerCase().replace(/\s+/g, "")}.co.in`,
      website: `https://energy.${displayCity.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      office: `Vidyut Office Complex, Substation Block, ${displayCity}, ${displayState}`,
      hours: "24/7 Emergency Line • Office: 10:00 AM - 5:00 PM",
      responseTime: "24 Hours"
    };
  } else if (category === "Water/Sanitation" && isDrainageOrManhole) {
    return {
      name: `${displayCity} Municipal Drainage & Sewage Division`,
      phone: "+91-555-0144-SEWR",
      emergencyPhone: "+91-555-0111-EMER",
      email: `drainage@${displayCity.toLowerCase().replace(/\s+/g, "")}-mc.gov.in`,
      website: `https://mc.${displayCity.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      office: `Engineering Annex, Municipal Complex, ${displayCity}, ${displayState}`,
      hours: "10:00 AM - 5:30 PM (Mon-Sat)",
      responseTime: "36 Hours"
    };
  } else if (category === "Water/Sanitation") {
    return {
      name: `${displayCity} Water Supply Department`,
      phone: "+91-555-0122-WATR",
      emergencyPhone: "+91-555-0133-WATR",
      email: `watersupport@${displayCity.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      website: `https://${displayCity.toLowerCase().replace(/\s+/g, "")}-water.gov.in`,
      office: `Jal Bhawan, Water Supply Wing, Near Municipal Reservoir, ${displayCity}, ${displayState}`,
      hours: "9:30 AM - 6:00 PM (Mon-Sat)",
      responseTime: "24 Hours"
    };
  } else if (category === "Trash/Litter" || isDumping) {
    return {
      name: `${displayCity} Municipal Corporation Sanitation Wing`,
      phone: "+91-555-0188-TRSH",
      emergencyPhone: "+91-555-0189-TRSH",
      email: `sanitation@${displayCity.toLowerCase().replace(/\s+/g, "")}-mc.gov.in`,
      website: `https://mc.${displayCity.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      office: `Municipal Corporation Office, Ward Control Centre, ${displayCity}, ${displayState}`,
      hours: "7:30 AM - 3:30 PM (Daily)",
      responseTime: "16 Hours"
    };
  } else {
    return {
      name: `${displayCity} Municipal Corporation`,
      phone: "+91-555-0111-CIVC",
      email: `support@${displayCity.toLowerCase().replace(/\s+/g, "")}-mc.gov.in`,
      website: `https://mc.${displayCity.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      office: `Municipal Corporation Headquarters, Civil Lines, ${displayCity}, ${displayState}`,
      hours: "9:30 AM - 6:00 PM (Mon-Sat)",
      responseTime: "48 Hours"
    };
  }
}

// Generates dynamic localized emergency contacts based on the user's live coordinates
export function getEmergencyContacts(location: UserLocation | null): EmergencyContact[] {
  const lat = location?.latitude ?? 26.9124;
  const lng = location?.longitude ?? 75.7873;
  const city = location?.city ?? "Jaipur";
  const state = location?.state ?? "Rajasthan";
  const lowerCity = city.toLowerCase();

  // Define contacts tailored to the location
  let config = {
    policeName: "Jaipur Police Station Center",
    policePhone: "+91-141-2229200",
    policeEmail: "controlroom.jaipur@rajpolice.gov.in",
    policeWebsite: "https://jaipurpolice.rajasthan.gov.in",
    policeOffice: "Police Headquarters, Lal Kothi, Jaipur, RJ 302015",
    
    medicalName: "SMS Government Hospital Emergency Desk",
    medicalPhone: "+91-141-2560291",
    medicalEmail: "sms-emergency@rajasthan.gov.in",
    medicalWebsite: "https://medicaleducation.rajasthan.gov.in/smsmedicalcollege",
    medicalOffice: "SMS Hospital, JLN Marg, Jaipur, RJ 302004",

    fireName: "Jaipur Fire Station Control Room",
    firePhone: "+91-141-2201414",
    fireEmail: "fire.control@jaipurmc.org",
    fireWebsite: "https://jaipurmc.org",
    fireOffice: "Central Fire Station, Ghat Gate, Jaipur, RJ 302003",

    elecName: "JVVNL Electricity Emergency Desk",
    elecPhone: "1800-180-6127",
    elecEmail: "jvvnl.helpline@rvpn.co.in",
    elecWebsite: "https://energy.rajasthan.gov.in/jvvnl",
    elecOffice: "Jaipur Discom Power Grid Control, Jyoti Nagar, Jaipur, RJ 302005",

    waterName: "PHED Water Supply Emergency Cell",
    waterPhone: "+91-141-2224555",
    waterEmail: "phed-control@rajasthan.gov.in",
    waterWebsite: "https://phedwater.rajasthan.gov.in",
    waterOffice: "Jal Bhawan, Water Supply Wing, Civil Lines, Jaipur, RJ 302006",

    civicName: "Jaipur Municipal Corporation Control Centre",
    civicPhone: "+91-141-2741424",
    civicEmail: "controlroom.jmc@rajasthan.gov.in",
    civicWebsite: "https://jaipurmc.org",
    civicOffice: "JMC HQ, Pt. Deendayal Upadhyay Bhawan, Tonk Road, Jaipur, RJ 302015"
  };

  if (lowerCity.includes("bengaluru") || lowerCity.includes("bangalore")) {
    config = {
      policeName: "Bengaluru City Police Commissionerate",
      policePhone: "+91-80-22942222",
      policeEmail: "bcpcontrol@ksp.gov.in",
      policeWebsite: "https://bcp.gov.in",
      policeOffice: "No. 1, Infantry Road, Bengaluru, KA 560001",
      
      medicalName: "Victoria Government Hospital Emergency ER",
      medicalPhone: "+91-80-26701150",
      medicalEmail: "victoria-hospital@karnataka.gov.in",
      medicalWebsite: "https://bmcri.org",
      medicalOffice: "Victoria Hospital, Near K.R. Market, Bengaluru, KA 560002",

      fireName: "Karnataka Fire Force HQ & Control Room",
      firePhone: "+91-80-22971500",
      fireEmail: "firecontrol@karnataka.gov.in",
      fireWebsite: "https://ksfes.karnataka.gov.in",
      fireOffice: "Fire Force HQ, No. 2, Ulsoor Road, Bengaluru, KA 560042",

      elecName: "BESCOM Power Grid Emergency Desks",
      elecPhone: "1912",
      elecEmail: "helpline@bescom.co.in",
      elecWebsite: "https://bescom.karnataka.gov.in",
      elecOffice: "BESCOM Grid Operations, Hudson Circle, Bengaluru, KA 560001",

      waterName: "BWSSB Water Leakage Central Desk",
      waterPhone: "1916",
      waterEmail: "watercontrol@bwssb.gov.in",
      waterWebsite: "https://bwssb.karnataka.gov.in",
      waterOffice: "Central Water Control Centre, Cauvery Bhawan, Bengaluru, KA 560009",

      civicName: "BBMP Central Ward Control Headquarters",
      civicPhone: "+91-80-22660000",
      civicEmail: "controlroom@bbmp.gov.in",
      civicWebsite: "https://bbmp.gov.in",
      civicOffice: "BBMP Headquarters, Corporation Circle, Bengaluru, KA 560002"
    };
  } else if (lowerCity.includes("mumbai")) {
    config = {
      policeName: "Mumbai Police Main Control Room",
      policePhone: "+91-22-22621855",
      policeEmail: "cp.mumbai@mahapolice.gov.in",
      policeWebsite: "https://mumbaipolice.gov.in",
      policeOffice: "Police Commissioner's Office, Crawford Market, Mumbai, MH 400001",
      
      medicalName: "KEM Government Hospital Trauma Center",
      medicalPhone: "+91-22-24107000",
      medicalEmail: "kem-emergency@kem.edu",
      medicalWebsite: "https://kem.edu",
      medicalOffice: "Acharya Donde Marg, Parel, Mumbai, MH 400012",

      fireName: "Mumbai Fire Brigade Headquarters",
      firePhone: "+91-22-23076111",
      fireEmail: "fire@mcgm.gov.in",
      fireWebsite: "https://portal.mcgm.gov.in",
      fireOffice: "Byculla Fire Station, Jagannath Bhatankar Marg, Byculla, Mumbai, MH 400008",

      elecName: "MSEDCL Mumbai Grid Helpline",
      elecPhone: "+91-22-26474211",
      elecEmail: "mumbaisupport@mahadiscom.in",
      elecWebsite: "https://mahadiscom.in",
      elecOffice: "Prakashgad Grid HQ, Bandra East, Mumbai, MH 400051",

      waterName: "BMC Hydraulic Engineering Division Cell",
      waterPhone: "+91-22-22620251",
      waterEmail: "watercontrol.mumbai@mcgm.gov.in",
      waterWebsite: "https://portal.mcgm.gov.in",
      waterOffice: "BMC Water Office, Worli, Mumbai, MH 400018",

      civicName: "BMC Central Command Center",
      civicPhone: "1916",
      civicEmail: "portalcontrol@mcgm.gov.in",
      civicWebsite: "https://portal.mcgm.gov.in",
      civicOffice: "Mahapalika Marg, Fort, Mumbai, MH 400001"
    };
  } else if (lowerCity.includes("delhi")) {
    config = {
      policeName: "Delhi Police Commissionerate Control Desk",
      policePhone: "+91-11-23490201",
      policeEmail: "cp.delhi@delhipolice.gov.in",
      policeWebsite: "https://delhipolice.gov.in",
      policeOffice: "Delhi Police Headquarters, Jai Singh Road, New Delhi 110001",
      
      medicalName: "AIIMS Trauma & Emergency Department",
      medicalPhone: "+91-11-26588500",
      medicalEmail: "aiims-trauma@aiims.edu",
      medicalWebsite: "https://aiims.edu",
      medicalOffice: "Ansari Nagar, Ring Road, New Delhi 110029",

      fireName: "Delhi Fire Service Head Control Room",
      firePhone: "+91-11-23412222",
      fireEmail: "gfire@nic.in",
      fireWebsite: "https://dfs.delhigovt.nic.in",
      fireOffice: "Connaught Place Fire Station, New Delhi 110001",

      elecName: "BSES Electricity Emergency Cell",
      elecPhone: "19122",
      elecEmail: "electricity@bsesdelhi.com",
      elecWebsite: "https://bsesdelhi.com",
      elecOffice: "BSES Power Station Control, Nehru Place, New Delhi 110019",

      waterName: "Delhi Jal Board Water Emergency Cell",
      waterPhone: "1916",
      waterEmail: "waterleakage@djb.nic.in",
      waterWebsite: "https://delhijalboard.nic.in",
      waterOffice: "Varunalaya Complex, Jhandewalan, New Delhi 110005",

      civicName: "MCD Unified Control Command Centre",
      civicPhone: "155305",
      civicEmail: "mcdcontrol@mcd.nic.in",
      civicWebsite: "https://mcdonline.nic.in",
      civicOffice: "Civic Centre, Minto Road, New Delhi 110002"
    };
  } else if (lowerCity.includes("san francisco") || lowerCity.includes("francisco")) {
    config = {
      policeName: "San Francisco Police Department (SFPD) HQ",
      policePhone: "+1-415-553-0123",
      policeEmail: "sfpd.chief@sfgov.org",
      policeWebsite: "https://sanfranciscopolice.org",
      policeOffice: "SFPD Headquarters, 1251 3rd St, San Francisco, CA 94158",
      
      medicalName: "Zuckerberg SF General Hospital Trauma Center",
      medicalPhone: "+1-628-206-8000",
      medicalEmail: "zsfg.er@sfdph.org",
      medicalWebsite: "https://zuckerbergsanfranciscogeneral.org",
      medicalOffice: "1001 Potrero Ave, San Francisco, CA 94110",

      fireName: "San Francisco Fire Department (SFFD) HQ",
      firePhone: "+1-415-558-3200",
      fireEmail: "sffd.info@sfgov.org",
      fireWebsite: "https://sf-fire.org",
      fireOffice: "SFFD HQ, 698 2nd St, San Francisco, CA 94107",

      elecName: "PG&E Power Outage Emergency Line",
      elecPhone: "+1-800-743-5002",
      elecEmail: "gridoutage@pge.com",
      elecWebsite: "https://pge.com",
      elecOffice: "PG&E Operations, 77 Beale St, San Francisco, CA 94105",

      waterName: "SFPUC Water Main Break Response Unit",
      waterPhone: "+1-415-550-4911",
      waterEmail: "wateremergency@sfwater.org",
      waterWebsite: "https://sfpuc.org",
      waterOffice: "525 Golden Gate Ave, San Francisco, CA 94102",

      civicName: "San Francisco 311 Contact Center",
      civicPhone: "311",
      civicEmail: "sf311support@sfgov.org",
      civicWebsite: "https://sf311.org",
      civicOffice: "City Hall Room 311, 1 Dr. Carlton B. Goodlett Pl, San Francisco, CA 94102"
    };
  } else {
    // Dynamic fallback for any other city
    const displayCity = city;
    const displayState = state;
    config = {
      policeName: `${displayCity} Police Department`,
      policePhone: "+91-555-0100",
      policeEmail: `police@${displayCity.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      policeWebsite: `https://${displayCity.toLowerCase().replace(/\s+/g, "")}-police.gov.in`,
      policeOffice: `Central Police Lines, Main Court Road, ${displayCity}, ${displayState}`,
      
      medicalName: `${displayCity} Civil Hospital Emergency`,
      medicalPhone: "+91-555-0101",
      medicalEmail: `er@${displayCity.toLowerCase().replace(/\s+/g, "")}-hospital.gov.in`,
      medicalWebsite: `https://${displayCity.toLowerCase().replace(/\s+/g, "")}-hospital.gov.in`,
      medicalOffice: `Civil Hospital Road, Near Government Circle, ${displayCity}, ${displayState}`,

      fireName: `${displayCity} Fire Brigade Services`,
      firePhone: "+91-555-0102",
      fireEmail: `fire@${displayCity.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      fireWebsite: `https://${displayCity.toLowerCase().replace(/\s+/g, "")}-fire.gov.in`,
      fireOffice: `Fire Station Road, Municipal Block, ${displayCity}, ${displayState}`,

      elecName: `${displayCity} Electricity Grid Helpdesk`,
      elecPhone: "1912",
      elecEmail: `power@${displayCity.toLowerCase().replace(/\s+/g, "")}.co.in`,
      elecWebsite: `https://energy.${displayCity.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      elecOffice: `State Electricity Substation Compound, ${displayCity}, ${displayState}`,

      waterName: `${displayCity} Water Supply Emergency Cell`,
      waterPhone: "+91-555-0103",
      waterEmail: `water@${displayCity.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      waterWebsite: `https://${displayCity.toLowerCase().replace(/\s+/g, "")}-water.gov.in`,
      waterOffice: `Jal Bhawan Complex, Near Reservoir Circle, ${displayCity}, ${displayState}`,

      civicName: `${displayCity} Municipal Corporation Command Cell`,
      civicPhone: "+91-555-0104",
      civicEmail: `municipal@${displayCity.toLowerCase().replace(/\s+/g, "")}-mc.gov.in`,
      civicWebsite: `https://mc.${displayCity.toLowerCase().replace(/\s+/g, "")}.gov.in`,
      civicOffice: `Municipal Corporation HQ, Ward No. 1, ${displayCity}, ${displayState}`
    };
  }

  // Create emergency entities with dynamic coordinates (using tiny offsets for distance calculations)
  return [
    {
      id: "emerg_police",
      category: "Police",
      name: config.policeName,
      phone: config.policePhone,
      email: config.policeEmail,
      website: config.policeWebsite,
      office: config.policeOffice,
      hours: "24/7 Operations",
      latitude: lat + 0.0035,
      longitude: lng - 0.0028
    },
    {
      id: "emerg_medical",
      category: "Medical",
      name: config.medicalName,
      phone: config.medicalPhone,
      email: config.medicalEmail,
      website: config.medicalWebsite,
      office: config.medicalOffice,
      hours: "24/7 Trauma Care",
      latitude: lat - 0.0042,
      longitude: lng + 0.0031
    },
    {
      id: "emerg_fire",
      category: "Fire",
      name: config.fireName,
      phone: config.firePhone,
      email: config.fireEmail,
      website: config.fireWebsite,
      office: config.fireOffice,
      hours: "24/7 Fire Control",
      latitude: lat + 0.0065,
      longitude: lng + 0.0048
    },
    {
      id: "emerg_electricity",
      category: "Electricity",
      name: config.elecName,
      phone: config.elecPhone,
      email: config.elecEmail,
      website: config.elecWebsite,
      office: config.elecOffice,
      hours: "24/7 Emergency Lines",
      latitude: lat - 0.0025,
      longitude: lng - 0.0041
    },
    {
      id: "emerg_water",
      category: "Water",
      name: config.waterName,
      phone: config.waterPhone,
      email: config.waterEmail,
      website: config.waterWebsite,
      office: config.waterOffice,
      hours: "24/7 Central Leakage Line",
      latitude: lat + 0.0049,
      longitude: lng - 0.0019
    },
    {
      id: "emerg_civic",
      category: "Civic",
      name: config.civicName,
      phone: config.civicPhone,
      email: config.civicEmail,
      website: config.civicWebsite,
      office: config.civicOffice,
      hours: "9:00 AM - 6:00 PM (Daily)",
      latitude: lat + 0.0078,
      longitude: lng + 0.0095
    }
  ];
}
