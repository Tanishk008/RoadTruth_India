/** Who to write to and where to escalate, keyed by the short authority name used in lib/data/expressways.ts. */
export interface Authority {
  key: string
  name: string
  nameHi?: string
  /** Postal address for RTI applications, when we're confident of it. */
  address?: string
  /** Online RTI filing portal, when the authority is on one. */
  rtiPortal?: { label: string; url: string }
  grievancePortal: { label: string; url: string }
  /** 24×7 helpline that registers road complaints for this authority's roads. */
  helpline?: { number: string; label: string }
}

const CPGRAMS = { label: "CPGRAMS (pgportal.gov.in)", url: "https://pgportal.gov.in" }
const UP_RTI = { label: "UP RTI Online", url: "https://rtionline.up.gov.in" }
const UP_IGRS = { label: "IGRS Jansunwai (Uttar Pradesh)", url: "https://jansunwai.up.nic.in" }
const MH_RTI = { label: "Maharashtra RTI Online", url: "https://rtionline.maharashtra.gov.in" }

export const authorities: Record<string, Authority> = {
  NHAI: {
    key: "NHAI",
    name: "National Highways Authority of India",
    nameHi: "भारतीय राष्ट्रीय राजमार्ग प्राधिकरण",
    address: "G 5 & 6, Sector 10, Dwarka, New Delhi – 110075",
    rtiPortal: { label: "RTI Online (rtionline.gov.in)", url: "https://rtionline.gov.in" },
    grievancePortal: CPGRAMS,
    helpline: { number: "1033", label: "NHAI highway helpline" },
  },
  UPEIDA: { key: "UPEIDA", name: "Uttar Pradesh Expressways Industrial Development Authority", rtiPortal: UP_RTI, grievancePortal: UP_IGRS },
  YEIDA: { key: "YEIDA", name: "Yamuna Expressway Industrial Development Authority", rtiPortal: UP_RTI, grievancePortal: UP_IGRS },
  MSRDC: { key: "MSRDC", name: "Maharashtra State Road Development Corporation", rtiPortal: MH_RTI, grievancePortal: CPGRAMS },
  MMRDA: { key: "MMRDA", name: "Mumbai Metropolitan Region Development Authority", rtiPortal: MH_RTI, grievancePortal: CPGRAMS },
  BMC: { key: "BMC", name: "Brihanmumbai Municipal Corporation", rtiPortal: MH_RTI, grievancePortal: CPGRAMS },
  HSIIDC: { key: "HSIIDC", name: "Haryana State Industrial & Infrastructure Development Corporation", grievancePortal: CPGRAMS },
  TNRDC: { key: "TNRDC", name: "Tamil Nadu Road Development Company", grievancePortal: CPGRAMS },
  HMDA: { key: "HMDA", name: "Hyderabad Metropolitan Development Authority", grievancePortal: CPGRAMS },
}

/** Roads outside our directory: the citizen fills in the authority. */
export const unknownAuthority: Authority = { key: "", name: "", grievancePortal: CPGRAMS }

/** "HMDA (toll lease: …)" → HMDA entry. */
export function authorityFor(label: string | undefined): Authority {
  const key = label?.split(/[\s(]/)[0] ?? ""
  return authorities[key] ?? unknownAuthority
}
