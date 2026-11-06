# Validation of two Dubai consumer app ideas (Nov 2026): Idea A, a tenant rent-renewal assistant, and Idea B, a Salik/parking/car running-cost optimiser

Research date: 6 November 2026. App-store figures were pulled on 6 Nov 2026 from the UAE App Store (iTunes Search/Lookup API and the UAE customer-reviews RSS feed) and from Google Play (gl=ae). Ratings change constantly, so treat them as a snapshot. Background facts given in the brief (Dh99k average rent, the 69% would-move figure, Salik/Parkin pricing timeline, Dh250–300 → Dh550+ anecdotes) were not re-researched.

Macro context that affects both ideas: ValuStrat says Dubai residential values fell a cumulative 10% "since the onset of the conflict on February 28th" 2026, to June 2026 — [ValuStrat VPI June 2026 via Zawya](https://www.zawya.com/en/press-release/research-studies/valustrat-dubai-residential-vpi-june-2026-dubai-residential-market-sees-softer-price-decline-and-stronger-sales-in-june-398908). Salik attributed its H1 2026 traffic decline to "regional events that began in late February 2026" — [Khaleej Times, 5 Aug 2026](https://www.khaleejtimes.com/business/saliks-h1-profits-drop-87-as-fines-number-of-trips-decline).

---

## A1. Idea A: what already exists for tenants, how good is it, and is it free?

### Takeaway
Every core data feature in Idea A already exists for free. Bayut TruEstimate gives comparable rents (including a new-versus-renewed contract toggle) from DLD data. The RERA calculator and Smart Rental Index give legality and an average-rent range. Property Finder Data Guru gives building and area insights. The paid tools (Property Monitor, Reidin) are B2B. What does not exist is a tenant-side workflow product covering the decision, the negotiation and the dispute. The official Dubai REST app is poorly rated on iOS.

### Cited Findings
**Official tools (free)**
- The RERA Rent Calculator, on the DLD website and in the Dubai REST app, gives an indicative cap based on category, location and current rent, and shows the maximum legal increase, if any — [Bayut MyBayut rent-negotiation guide](https://bayut.com/mybayut/rent-negotiation-tips-dubai); [Mondaq renewal guide](https://www.mondaq.com/how-to-renew-a-tenancy-contract-in-dubai-%7C-rules-fees-timeline/1821204).
- Users enter an Ejari or DEWA number to see average rental values and whether an increase is allowed — [DP.ae Smart Rental Index 2026 blog](https://dp.ae/blog/post/197/dubai-smart-rental-index-2026-what-landlords-investors-and-homeowners-need-to-know/) (agency blog; secondary).
- Dubai REST (Dubai Land Department) on iOS: **2.36★ from 523 ratings**, v7.3.0 updated 5 Oct 2026, free — [App Store UAE listing](https://apps.apple.com/ae/app/dubai-rest/id1437805105) (accessed 6 Nov 2026). On Google Play: **4.19★ from 1,244 ratings, 500K+ downloads** — [Google Play listing](https://play.google.com/store/apps/details?id=ae.gov.dubailand.selfregistration&hl=en&gl=ae) (accessed 6 Nov 2026).
- Recent Dubai REST iOS reviews are almost all 1★ and about bugs, not missing features: "Logged in to get my new Ejari. It won't accept DEWA number input… when you click certificate, it says 'no data available'" (2 Aug 2026), "Upload button is not working… tenancy contract" (9 Oct 2026), "Gets stuck on the first screen" (19 Aug 2026), and "Ejari Contract Services not working: Please revert to the older version" (2 Aug 2026) — [App Store UAE reviews, Dubai REST](https://apps.apple.com/ae/app/dubai-rest/id1437805105) (most-recent feed, accessed 6 Nov 2026).
- Ejari renewal through Dubai REST costs about AED 177.75 — [Gulf News, 11 extra costs when renting](https://gulfnews.com/living-in-uae/housing/renting-in-dubai-11-extra-costs-to-expect-when-moving-into-a-new-home-1.500296020).
- DLD introduced a "Model Tenant Classification" system that provides credit ratings and reports through Ejari and the smart app — [Khaleej Times, 2 Jan 2025](https://www.khaleejtimes.com/business/property/new-dubai-smart-rental-index-landlords-must-improve-property-ratings-to-hike-rents).
- DLD launched "Flexi Rent" on 23 June 2026, which lets tenants spread rent across more instalments — [The National, 26 Jun 2026](https://thenationalnews.com/business/property/2026/06/26/dubai-rental-market-cools-as-supply-surge-hands-tenants-new-negotiating-power).

**Portals (free to consumers)**
- Bayut TruEstimate Rental Reports are free. They show a rental value with a confidence level (High/Medium/Low), an estimated yearly range, a suggested monthly rent and price per sq ft. Users can switch between **new and renewed contracts**, and a "View More Transactions" link goes to the Dubai Transactions page — [Bayut, TruEstimate Rental Report](https://www.bayut.com/mybayut/truestimate-rental-report/); [Bayut support: What is TruEstimate](https://support.bayut.com/hc/en-us/articles/28576714020882-What-is-TruEstimate-and-how-does-it-work).
- TruEstimate "leverages the extensive data from the Dubai Land Department (DLD)". Dubai Transactions is Bayut's real-time analytics tool built on DLD data, and Sales History and Rental History are available to logged-in users — [Bayut TruEstimate valuation page](https://www.bayut.com/mybayut/truestimate-property-valuation/); [Entrepreneur ME](https://mena.entrepreneur.com/?p=38067). These are vendor sources, and I found no independent accuracy review.
- The Bayut app on iOS: **4.78★ from 20,356 ratings**, free — [App Store UAE](https://apps.apple.com/ae/app/id923263211) (accessed 6 Nov 2026).
- Property Finder Data Guru is free on the website and app. It includes a Price Map, Community Insights (average prices by size, popular buildings), Residential Insights (nearby towers' pricing, historical price trends, supply, building age) and a Rent vs Buy calculator — [Property Finder blog: check market rental prices](https://www.propertyfinder.ae/blog/check-market-rental-prices/); [PF Home Value Estimator, "Powered by DataGuru"](https://Propertyfinder.ae/en/tools/home-value-estimator). The Property Finder app on iOS: **4.70★ from 9,141 ratings** — [App Store UAE](https://apps.apple.com/ae/app/id897540233) (accessed 6 Nov 2026).
- A real tenant in June 2026 used **Property Finder listings showing rents in her building down about 20%** to argue for a reduction, even though her rent was within the Smart Rental Index range — [The National, 26 Jun 2026](https://thenationalnews.com/business/property/2026/06/26/dubai-rental-market-cools-as-supply-surge-hands-tenants-new-negotiating-power).

**Professional data vendors (paid, B2B)**
- Property Monitor was acquired by Dubizzle Group (other sources give April 2025). It runs a subscription PMiQ platform with tiered pricing, and has "more than 7,700 monthly users, primarily real estate agencies and property developers" — [Arabian Business tag page](https://www.arabianbusiness.com/tags/property-monitor); [Gulf Business tag page](https://gulfbusiness.com/en/tag/property-monitor/).
- A third-party estimate puts Property Monitor at about AED 5,000–15,000 per year for one professional user. It combines DLD transactions with Ejari rentals for yield ranges by area and unit type. Reidin is enterprise-only, "rarely below tens of thousands of AED per year". DXBinteract is free for core features with paid API/bulk tiers, but covers sales, not rents — [Real Estate Club Dubai comparison, 2 May 2026](https://realestateclubdubai.com/blog/investment/dxbinteract-property-monitor-reidin-dubai-data-platforms-compared-2026) (blog; pricing unverified).
- ValuStrat publishes its monthly Dubai VPI reports as free downloads. Its 2026 outlook forecasts residential rental growth "broadly flat (0%) in 2026" — [ValuStrat VPI July 2026 product page](https://valustrat.com/products/dubai-vpi-residential-values-july-2026); [ValuStrat Outlook 2026 via Zawya](https://www.zawya.com/en/press-release/research-and-studies/valustrat-dubai-real-estate-outlook-2026-residential-growth-moderates-as-supply-expands-ulcezbae).

**Tenant-focused apps**
- An App Store search for "ejari" or "rent dubai" (UAE, 6 Nov 2026) returned no tenant-advocacy or negotiation app. Results were Dubai REST, DubaiNow, DEWA, portals, "Ejary" (a holiday-rental management app with 0 ratings), and Wasl (a landlord's app, **2.42★ from 157 ratings**) — [iTunes Search API, term=ejari, country=ae](https://itunes.apple.com/search?term=ejari&country=ae&entity=software); [iTunes Search API, term=rent+dubai](https://itunes.apple.com/search?term=rent+dubai&country=ae&entity=software).
- Tenant help exists mainly as free web content: negotiation scripts, a free RDC fee calculator, and guides from agencies and blogs — [Real Estate Club Dubai, RDC fee calculator](https://realestateclubdubai.com/tools/rdc-fee-calculator); [Real Estate Club Dubai, negotiation scripts 2026](https://realestateclubdubai.com/blog/renting/how-to-negotiate-rent-dubai-2026-market-data-scripts-timing-tips).
- Rent-payment fintechs target the same tenants. In 2023, Keyper's example was Dh105,000 in 12 card payments on a Dh100,000 rent (a **5% premium**), and Keyper planned a Property Finder integration for H1 2026. A competitor, Rently, implies about 12.5% annualised — [search summary of The National, Apr 2026, and Gulf News](https://www.thenationalnews.com/business/property/2026/04/20/dubai-rent-can-tenants-finally-pay-monthly-instead-of-upfront-cheques/); [Rently blog](https://rently-uae-prod.pages.dev/blog/rnpl-services-uae). I did not confirm current fees or whether the PF integration is live.

### Inferences
- The "what do comparable units rent for" feature is commoditised and free from two portals with 9k–20k-rating apps. A solo founder cannot win on data breadth. The only data angle that is plausibly better is a renewal-specific evidence pack: same project, same bedrooms, renewals versus new leases over the last 3–6 months.
- The official tooling answers "is the landlord's increase legal?". It does not answer "should I ask for a decrease, by how much, and is it worth moving?". In 2026 that second question is the more valuable one (see A3).
- The poor iOS Dubai REST rating reflects bugs. It does not show demand for a third-party tool, because Ejari registration itself can't be done by a third-party app.
- Bayut and Property Finder earn mostly from landlord and agent listings, so they have little incentive to build a tenant "negotiate my rent down" workflow. They could, however, add a button cheaply if one gained traction.

### Gaps
- I found no rating or review data for the RERA calculator on its own (it lives inside Dubai REST and on the DLD site).
- There is no independent accuracy benchmark for Bayut TruEstimate or PF Data Guru rental estimates.
- I could not confirm Property Finder's "Insights" product separately from Data Guru, or whether either requires sign-up for rent history.
- I did not research Reidin's pricing on its own site or ValuStrat's rent-specific data (its VPI is a capital-value index).

---

## A2. Idea A: is Ejari and DLD rental data publicly and legally available via API or download, and under what licence?

### Takeaway
Yes, with real limits. DLD publishes Ejari rent contracts as open data: a captcha-gated CSV download for the current year on dubailand.gov.ae, older years on data.dubai / Dubai Pulse, and an API that needs registered keys. The Dubai Open Data Law and the draft Dubai open-data licence allow commercial reuse. However, the rent records have **no building name or unit number**, only area, project and master project, so true building-level comparables are imprecise outside named freehold projects.

### Cited Findings
- The DLD Open Data page (dubailand.gov.ae) has a **"Rents" tab** with "Download as CSV" behind a **captcha**. Its filters are a mandatory date range, freehold flag, **Version (New/Renew)**, area, usage and property type — [DLD Open Data: Real Estate Data](https://dubailand.gov.ae/en/open-data/real-estate-data/) (fetched 6 Nov 2026; page footer "last updated on 03 November 2026").
- The rent CSV columns listed on that page are: Registration Date, Start Date, End Date, Version, Area, Contract Amount, Annual Amount, Is Free Hold, Property Size (sq.m), Property Type, Property Sub Type, Number of Rooms, Usage, Nearest Metro, Nearest Mall, Nearest Landmark, Parking, No of Units, **Master Project, Project**. There is no building-name, unit-number or landlord field in the rent tab — [DLD Open Data: Real Estate Data](https://dubailand.gov.ae/en/open-data/real-estate-data/).
- The same page states: "For previous year data kindly visit data.dubai, an initiative by Digital Dubai" — [DLD Open Data](https://dubailand.gov.ae/en/open-data/real-estate-data/). An Apify scraper's documentation likewise says the DLD open-data gateway serves the current calendar year, so multi-year history needs scheduled runs — [Apify, DLD transactions and rents scraper](https://apify.com/ams3d/dubai-dld-transactions-rents.md).
- Dubai Pulse lists an open "dld_rent_contracts-open" dataset. API access requires registration, and users receive an "API Key" and "API Secret" by email when the dataset is granted, followed by a client-credentials OAuth token — [Dubai Pulse, DLD rent contracts dataset](https://www.dubaipulse.gov.ae/data/dld-registration/dld_rent_contracts-open?page=1) (search snippet). When I fetched it directly on 6 Nov 2026, the page **returned HTTP 503 and then a connection reset**, so availability and reliability are a risk.
- A May 2026 blog says the DLD open data is free, includes Ejari tenancy data as raw CSVs "refreshed weekly", and uses "property identifiers rather than building names, so users must join files themselves" — [Real Estate Club Dubai, 2 May 2026](https://realestateclubdubai.com/blog/investment/dxbinteract-property-monitor-reidin-dubai-data-platforms-compared-2026) (secondary).
- Dubai Law No. 26 of 2015 (the Dubai Data Law) was published on 27 Dec 2015. It defines open data as data that can be "downloaded, used and re-used without restrictions by all types of users" — [Data Protection Report, Mar 2016](https://www.dataprotectionreport.com/2016/03/dubai-issues-open-data-law/); [Law No. 26 of 2015, Dubai Legislation Portal](https://dlp.dubai.gov.ae/Legislation%20Reference/2015/Law%20No.%20(26)%20of%202015.html).
- The draft Dubai Open Data Licence grants a "worldwide, royalty-free, non-exclusive licence to Use the Information… for commercial and non-commercial purposes". It is labelled DRAFT, so the final terms may differ — [Dubai Pulse, DRAFT Open Data Licence (PDF)](https://www.dubaipulse.gov.ae/docs/DDE%20_%20DRAFT_Open_Data%20Licence_LONG_Form_English%203.pdf).
- Dubai data in which third parties hold IP rights cannot be distributed as open data without the IPR owner's consent, and some entities add attribution and liability terms (for example, Dubai Municipality's MAKANI) — [Law No. 26 of 2015 (DEWA copy)](https://dewa.gov.ae/-/media/Files/About-DEWA/Legislations/English/Law-No26-of-2015-Regulating-Data-Dissemination-and-Exchange-in-the-Emirate-of-Dubai.ashx); search summary of Dubai Municipality terms.
- Commercial products already build on this data: DXBinteract "scrapes and structures" DLD transaction data, and Bayut TruEstimate and Property Monitor build on DLD and Ejari data — [Real Estate Club Dubai, 2 May 2026](https://realestateclubdubai.com/blog/investment/dxbinteract-property-monitor-reidin-dubai-data-platforms-compared-2026); [Bayut TruEstimate](https://www.bayut.com/mybayut/truestimate-property-valuation/).
- The RERA calculator's output for a specific contract (via Ejari/DEWA number) is not exposed as an open API. I found no documented endpoint for it — inferred from absence in the DLD open-data page and Dubai Pulse results above.

### Inferences
- Legally, building a product on the DLD rent CSV and Dubai Pulse API looks permitted for commercial use with attribution. Automating the captcha-gated DLD web download is a different matter. That would be circumventing a control and could raise unauthorised-access questions under the UAE cybercrime law (see B2), so use the keyed Dubai Pulse API or manual downloads.
- The "Version" field (New vs Renew) is the most valuable field for this idea. It lets you show, within the same project, the gap between renewal rents and new-lease rents, which is exactly the negotiation lever when the market is falling.
- No building name means that for older non-freehold buildings (Bur Dubai, Deira, Al Barsha, Karama), comparables can only go down to area plus rooms plus size. That is weaker than what Bayut shows, since Bayut can combine DLD with its own listings.
- No unit ID and no landlord field mean you cannot recover a specific unit's rent history from open data. The Ejari/DEWA-number lookup in the RERA calculator remains the only route to that, and it is an official, authenticated channel.

### Gaps
- I could not read the live, final Dubai Pulse / data.dubai licence text: the site returned 503 and only the DRAFT licence PDF was found.
- The exact update cadence (weekly versus daily) and the historical depth on data.dubai are unconfirmed.
- I did not verify whether Dubai Pulse API access for the rent dataset is granted automatically or needs approval, or whether there are rate limits.

---

## A3. Idea A: what is the RERA Smart Rental Index, and what in the 2025–26 legal and market picture changes the case?

### Takeaway
The Smart Rental Index (launched 2 Jan 2025) rates buildings from 1 to 5 stars on more than 60 criteria and blends area averages, building history and old and new contracts. It makes the legality check more precise, and it is free. The bigger change is the market: by Q3 2026, **21.4% of tenants were paying less than in their previous contract** and only 40% got increases. Tenants are also legally entitled to object to the index and ask the Rental Dispute Centre for a reduction at renewal. That moves the value from "is this increase legal?" (solved, free) to "how much of a decrease can I get, and should I move?" (unsolved).

### Cited Findings
**Smart Rental Index**
- DLD unveiled the Smart Rental Index in early January 2025 (KT article dated 2 Jan 2025). It covers residential property across Dubai, freehold and non-freehold, with commercial property to come later — [Khaleej Times, 2 Jan 2025](https://www.khaleejtimes.com/business/property/new-dubai-smart-rental-index-landlords-must-improve-property-ratings-to-hike-rents).
- Buildings are rated 1–5 stars, with classification based on more than 60 criteria. A DLD official said: "If someone wants to increase rents they have to increase classification and rating." Inputs are the area's average rents, the building's own rents, old and new contracts, and classification, each weighted. The index can be updated "in minutes", whereas the previous one was updated annually — [Khaleej Times, 2 Jan 2025](https://www.khaleejtimes.com/business/property/new-dubai-smart-rental-index-landlords-must-improve-property-ratings-to-hike-rents).
- One blog claims A/B/C/D building quality grades in 2026. This conflicts with KT's 1–5 star description and is unverified — [search summary of realestateclubdubai / aigentsrealty 2026 blogs](https://aigentsrealty.com/blog/dubai-smart-rental-index-2026-changes-guide). "Smart Rental Index 2026" appears to be marketing language for the same 2025 system — [DP.ae blog](https://dp.ae/blog/post/197/dubai-smart-rental-index-2026-what-landlords-investors-and-homeowners-need-to-know/).
- No increase is allowed if the current rent is within 10% below the average rental value of similar units — [Khaleej Times via Magzter, "Dubai's smart index ensures no major rent hikes at renewal"](https://www.magzter.com/en/stories/newspaper/Khaleej-Times/DUBAIS-SMART-INDEX-ENSURES-NO-MAJOR-RENT-HIKES-AT-RENEWAL) (search snippet).

**Legal levers for tenants**
- The governing law is still Law No. 26 of 2007, as amended by Law No. 33 of 2008, with Decree No. 43 of 2013 on rent increases. No new tenancy law replaced it in 2026; what tightened was enforcement and procedure — [Chambers, Dubai landlord-tenant law](https://chambers.com/articles/dubai-landlord-tenant-law-eviction-rent-increases-and-rdc-disputes); [search summary citing legalserviceindia 2026](https://www.legalserviceindia.com/Legal-Articles/?p=32854) (secondary).
- Increases are allowed only at renewal, with at least 90 days' notice before expiry — [Mondaq renewal guide](https://www.mondaq.com/how-to-renew-a-tenancy-contract-in-dubai-%7C-rules-fees-timeline/1821204); [The Law Reporters](https://thelawreporters.com/dubai-rent-increase-rules-rera-index-90-day-notice).
- The RDC chairman said the tenant "was entitled to object the output given to him by 'Rent Index' upon renewal of the contract, and to demand a reduction in rental value without being conformed to the rent index". Article 9 lets the RDC weigh other criteria besides the index, including the prevailing economic situation — [DLD news: RDC, condition of real estate is a significant factor](https://dubailand.gov.ae/en/news-media/rental-disputes-center-condition-of-real-estate-is-a-significant-factor-determining-rent-in-dubai) (search snippet; the page returned 404 when fetched on 6 Nov 2026). DLD also reported that the RDC ordered an owner to reduce rent on a commercial property — [DLD news](https://dubailand.gov.ae/en/news-media/rdc-obligated-a-real-estate-owner-to-reduce-the-rent-of-his-commercial-property).
- Sources conflict on the article numbers: some cite Article 13, requiring mutual consent for contract changes, and Article 9 for fair-rent determination by the Tribunal — [search summary: Zawya, KT, Chambers](https://www.khaleejtimes.com/uae/legal/dubai-property-rent-calculator-how-to-challenge-unfair-hike-in-prices).
- Landlords are prohibited from claiming lease-renewal fees — [DLD news](https://dubailand.gov.ae/en/news-media/landlord-is-prohibited-from-claiming-lease-renewal-fee/).
- RDC fees: 3.5% of annual rent, **minimum AED 500, maximum AED 20,000**, plus AED 100 process, AED 10 knowledge and AED 10 innovation fees, plus an AED 130 + VAT service-partner fee — [Property Finder RDC guide](https://www.propertyfinder.ae/blog/rental-dispute-settlement-centre-dubai/). Other guides give a different or no cap — [Dubizzle RDC guide](https://www.dubizzle.com/blog/property/rental-dispute-settlement-centre/). This conflict is unresolved.
- In Q2 2025 the RDC concluded 443 reconciliation agreements worth Dh190.7m, with a record six-day average resolution time — [Gulf News](https://gulfnews.com/uae/dubai-resolves-rental-disputes-in-record-six-day-average-1.500248196). DLD has launched a streamlined rental-dispute settlement service — [Gulf News](https://gulfnews.com/uae/dubai-launches-streamlined-rental-dispute-settlement-service-1.500422292).

**2026 market shift (favours the negotiate-or-move angle)**
- Q3 2026 (Cavendish Maxwell): **21.4% of rental transactions recorded a lower rent than the prior contract** (up from 4.8% in Q1), 38.7% renewed at the same rent, and increases fell to 40% (from 59.4%). Over 172,000 contracts were registered in Q3: **renewals 94,300 (−10.6% YoY)** and new contracts 77,700 (+18.2%). The average rent was Dh77.3/sq ft/yr, +5.5% YoY, down from 11.5% growth a year earlier. Cavendish Maxwell cites "diminishing landlord pricing power" and "greater scope for tenants to negotiate" — [Khaleej Times, 2 Nov 2026](https://www.khaleejtimes.com/business/dubai-rents-1-in-5-tenants-now-pays-less-than-before-as-rentals-ease-on-new-supply).
- Savills Q3 2026: apartment rents in Dubai Marina fell 12.8% YoY, Business Bay 12.2% and JVC 10.4% — [Khaleej Times](https://www.khaleejtimes.com/rents-in-dubai-fall-over-12-dubai-marina-business-bay-and-jvc-lead) (search snippet).
- Rents fell 1.1% in the three months to May 2026, and Cavendish Maxwell said "Tenants are likely to have more options and greater negotiating power than they've had in several years". Tenants' negotiation attempts had mixed results: one renewal was refused a reduction, and a landlord cut the asking rent from Dh195k to Dh175k — [The National, 26 Jun 2026](https://thenationalnews.com/business/property/2026/06/26/dubai-rental-market-cools-as-supply-surge-hands-tenants-new-negotiating-power).
- Average residential rents fell 6.2% quarter-on-quarter in Q2 2026 — [Gulf News](https://gulfnews.com/amp/story/business/property/dubai-rents-ease-62-while-home-prices-stay-above-2025-levels-1.500623468) (headline/snippet).
- Some tenants are temporarily shifting to short-term rentals, expecting rents to soften further (April 2026) — [Khaleej Times](https://www.khaleejtimes.com/business/property/rents-in-dubai-tenants-shifting-to-short-term-rentals-to-look-for-affordable-units).

### Inferences
- The Smart Rental Index is a ceiling tool. When roughly 60% of renewals are flat or down, the cap rarely binds, so a "is my increase legal?" app is solving 2024's problem. The tenant need in late 2026 is evidence for a decrease plus a credible alternative (a cheaper comparable unit nearby).
- The RDC fee (3.5% of annual rent, about Dh3,465 on a Dh99k rent) plus time cost means very few tenants will litigate. A threat-credible negotiation pack (index output plus renewal-versus-new comparables plus moving-cost maths) is the realistic product, not RDC case automation.
- About 94k renewals a quarter suggests roughly 350–400k renewal decisions a year. This is my extrapolation, with seasonality unknown. Each user, though, has a decision only once a year.
- If rents keep falling, the problem partly resolves itself: landlords cut asking rents, and the portal listings already show it. If rents rebound, the "is it legal?" question returns, and the official tool already answers it for free. The window for this product is real but cyclical.

### Gaps
- I could not retrieve the official DLD Smart Rental Index page or a full rule table (the bands under Decree 43/2013) from a primary source in this session.
- There is no official full-year 2025 RDC case count. One less-authoritative source claims more than 25,000 cases in 2024 (unverified).
- It is unclear whether the RERA calculator now shows the star rating and the average for similar units directly to tenants. KT's January 2025 article did not say.
- Legal-services licensing: whether an app that "prepares an RDC case" counts as unlicensed legal consultancy in Dubai was not researched and needs local counsel.

---

## A4. Idea A: is there evidence tenants would pay, or does the money come from referrals?

### Takeaway
I found no evidence of tenants paying for rent data or negotiation tools. Every consumer rent-data product is free, and the paid ones are B2B. Tenants demonstrably pay for adjacent rent services, such as instalment fintechs (about 5% premium) and agents (5% on a new lease), and moving carries large one-off costs. Monetisation therefore points to referrals at the "move" branch, rather than subscriptions.

### Cited Findings
- Consumer rent-data tools are free: Bayut TruEstimate — [Bayut](https://www.bayut.com/mybayut/truestimate-rental-report/); PF Data Guru — [Property Finder blog](https://www.propertyfinder.ae/blog/check-market-rental-prices/); the RERA calculator via DLD/Dubai REST — [Bayut guide](https://bayut.com/mybayut/rent-negotiation-tips-dubai); ValuStrat VPI reports are free downloads — [ValuStrat](https://valustrat.com/products/dubai-vpi-residential-values-july-2026).
- Paid rent data is sold to professionals: Property Monitor's users are "primarily real estate agencies and property developers" — [Gulf Business](https://gulfbusiness.com/en/tag/property-monitor/); Reidin is institutional only — [Real Estate Club Dubai, May 2026](https://realestateclubdubai.com/blog/investment/dxbinteract-property-monitor-reidin-dubai-data-platforms-compared-2026).
- Tenants do pay for rent-flexibility products. Keyper's 2023 model was a 5% premium (Dh105k for Dh100k rent) with a Dh500 late fee, and it raised an $11m Series A. Rently's personalised fee implies about 12.5% annualised. ezy.rent also offers Rent Now, Pay Later — [search summary: The National Apr 2026, Gulf News, KT](https://www.thenationalnews.com/business/property/2026/04/20/dubai-rent-can-tenants-finally-pay-monthly-instead-of-upfront-cheques/); [Rently](https://rently-uae-prod.pages.dev/blog/rnpl-services-uae). DLD's free "Flexi Rent" (launched 23 Jun 2026) now competes with this — [The National, 26 Jun 2026](https://thenationalnews.com/business/property/2026/06/26/dubai-rental-market-cools-as-supply-surge-hands-tenants-new-negotiating-power).
- Moving costs that a "move" decision triggers: an agency fee of about 5% of annual rent, a security deposit of 5% (unfurnished) or 10% (furnished), a refundable DEWA deposit of AED 2,000 (apartment) or 4,000 (villa) plus about AED 130 activation, and Ejari of about AED 177.75–220 — [Gulf News, 11 extra costs](https://gulfnews.com/living-in-uae/housing/renting-in-dubai-11-extra-costs-to-expect-when-moving-into-a-new-home-1.500296020); [Bayut hidden costs](https://www.bayut.com/mybayut/hidden-costs-renting-dubai/). Movers cost about AED 1,200–2,800 for an unfurnished unit, and total upfront costs run about AED 7,500–15,000 for a studio or 1-bed and AED 12,000–23,000 for a 2-bed — [SAMA Movers blog](https://samadubaimovers.pages.dev/blog/total-cost-moving-dubai-price-guide) (vendor source; may be biased).
- Home-services and movers marketplaces already exist with large user bases. For example, Justlife on iOS has **4.59★ from 46,225 ratings** — [App Store UAE](https://apps.apple.com/ae/app/id1107705982) (accessed 6 Nov 2026).

### Inferences
- On the brief's Dh99k average rent, the non-refundable cost of moving is about Dh7k+: a 5% agency fee of about Dh4,950, movers of about Dh1.2–2.8k, plus Ejari and DEWA activation. A move only pays off in year one if the new rent is about 7% or more below the renewal offer. That calculation is the core "renew / negotiate / move" logic, and it is quick to build.
- Referral revenue sits at the "move" branch: agents and portals (new-lease leads), movers, cleaning and handyman services, DEWA/internet setup, RNPL fintechs (Keyper, Rently), and mortgage brokers for tenants considering buying. These are inferred options; I did not verify any referral rate cards.
- A one-off paid "Renewal Pack" (comparables report, negotiation letter, RDC filing checklist) is plausible at a low price point. That is my inference only; there is no market evidence of willingness to pay.
- Low frequency (once a year per user) means paid acquisition is hard to recoup. Distribution has to come from SEO and content around renewal season and from WhatsApp sharing. Dubai rent-negotiation content is already crowded with agency blogs.

### Gaps
- There are no surveys on tenant willingness to pay for negotiation help in Dubai.
- I did not find referral or commission rates for movers marketplaces (ServiceMarket, Justlife), mortgage brokers, or RNPL providers.
- It is unknown whether a tenant-referral fee from a broker would itself be regulated under RERA broker rules.

---

## A5. Idea A verdict: go, maybe or no-go?

### Takeaway
**MAYBE, leaning towards go only as a lean, SEO-led "renewal decision and negotiation pack" with referral revenue, not as a data or subscription app.**
- **Main risk:** zero willingness to pay against free incumbents. Bayut and Property Finder already give comparables free, including renewal-versus-new splits, and could add a negotiation feature cheaply.
- **Main reason it could work:** the 2026 market turned (21.4% of tenants now pay less), yet the official tools only answer "is the increase legal?". Tenants have a legal right to request a reduction, there is free, commercially reusable DLD rent data with a New/Renew flag, and the founder's data skills fit the build.
- **Most plausible model:** a free web and app tool (index check, comparables, move-versus-stay maths, letter generator), with a low-priced one-off pack and referral income at the "move" branch.

### Cited Findings
- Comparables and legality are free from Bayut TruEstimate, PF Data Guru and RERA/Dubai REST — [Bayut](https://www.bayut.com/mybayut/truestimate-rental-report/); [Property Finder](https://www.propertyfinder.ae/blog/check-market-rental-prices/); [Bayut guide](https://bayut.com/mybayut/rent-negotiation-tips-dubai).
- DLD rent data is open with a New/Renew field, but has no building or unit identifiers — [DLD Open Data](https://dubailand.gov.ae/en/open-data/real-estate-data/).
- Q3 2026: 21.4% of tenants paid less, 38.7% the same, 40% more; 94,300 renewals in the quarter — [Khaleej Times, 2 Nov 2026](https://www.khaleejtimes.com/business/dubai-rents-1-in-5-tenants-now-pays-less-than-before-as-rentals-ease-on-new-supply).
- Tenants may object to the index at renewal and demand a reduction — [DLD news (snippet)](https://dubailand.gov.ae/en/news-media/rental-disputes-center-condition-of-real-estate-is-a-significant-factor-determining-rent-in-dubai).
- A tenant used Property Finder listings showing building rents down about 20% to push for a cut — [The National, 26 Jun 2026](https://thenationalnews.com/business/property/2026/06/26/dubai-rental-market-cools-as-supply-surge-hands-tenants-new-negotiating-power).

### Inferences
- Build cost fits the budget (well under AED 50k): an ETL from the DLD/Dubai Pulse rent CSVs, a project-level comparables model, an LLM letter generator in English and Arabic, and a move-cost calculator. The hard part is distribution, not the build.
- Kill criteria to test cheaply: launch a free web calculator before the Q1 2027 renewal season and measure (a) organic sign-ups per 1,000 visits, (b) the share who click "move" and accept a mover or agent referral, and (c) conversion on the paid pack at any price. If conversion on the paid pack is close to zero and referral clicks are low, stop.
- Keep "prepare an RDC case" to checklists and document assembly, pending legal advice on licensing.

### Gaps
- There is no direct willingness-to-pay data and no referral economics.
- The legal-services boundary for RDC preparation is unknown.

---

## B1. Idea B: what do the official Salik, Parkin, RTA and DubaiNow apps do, how are they rated, and what are the main complaints?

### Takeaway
The official apps already cover payment, trip and parking history, variable-rate and low-balance alerts, fines, disputes, licence and registration renewal, and insurance purchase. DubaiNow is the highly rated aggregator, with **4.79★ from 19,814 iOS ratings**. Salik and Parkin are rated poorly: Smart Salik **2.0★ (iOS, 1,099)** / 3.84★ (Play, 6,425); Parkin **2.39★ (iOS, 1,189)** / 2.86★ (Play, 1,993). Complaints are overwhelmingly about bugs, logins, adding vehicles, glitchy ticket extension and fines and disputes, not about missing "optimisation" features.

### Cited Findings
**Ratings snapshot (6 Nov 2026)**

| App (publisher) | iOS UAE rating (count) | Google Play rating (count, installs) | Source |
|---|---|---|---|
| Smart Salik (TransCore, official Salik app) | 2.00 (1,099), v4.1.5, 19 Oct 2026 | 3.84 (6,425), 1M+ | [App Store](https://apps.apple.com/ae/app/smart-salik/id912158362); [Google Play](https://play.google.com/store/apps/details?id=com.salik.smartsalik&hl=en&gl=ae) |
| Parkin (Parkin PJSC) | 2.39 (1,189), v1.7.2, 22 Oct 2026 | 2.86 (1,993), 500K+ | [App Store](https://apps.apple.com/ae/app/id6657993734); [Google Play](https://play.google.com/store/apps/details?id=parkin.ae.dev&hl=en&gl=ae) |
| RTA Dubai (RTA) | 3.60 (4,023), v6.5.0 | 4.08 (52,361), 5M+ | [App Store](https://apps.apple.com/ae/app/id426109507); [Google Play](https://play.google.com/store/apps/details?id=com.rta.rtadubai&hl=en&gl=ae) |
| DubaiNow (Dubai e-Government) | 4.79 (19,814), v14.7.4, 3 Nov 2026 | 4.04 (9,098), 1M+ | [App Store](https://apps.apple.com/ae/app/id619712783); [Google Play](https://play.google.com/store/apps/details?id=com.deg.mdubai&hl=en&gl=ae) |
| Dubai Police | 4.66 (311,383) | n/a | [App Store](https://apps.apple.com/ae/app/id384374316) |
| RTA Smart Drive (navigation) | 4.56 (15,392) | n/a | [App Store](https://apps.apple.com/ae/app/id926094022) |

**Features**
- The Salik app (relaunched 25 Jul 2025) offers recharge, trip tracking with full crossing history, notifications on variable toll rates, low balance, unpaid trips and violations, vehicle management and statements — [App Store description](https://apps.apple.com/ae/app/smart-salik/id912158362). It had more than 800,000 active users and 89,667 new downloads after the relaunch — [GCC Business News](https://www.gccbusinessnews.com/salik-new-mobile-app-and-whatsapp-channel/).
- Salik also runs a WhatsApp channel, and 150,000 customers have received vehicle-insurance renewal notifications through it — [ARY News](https://arynews.tv/salik-digital-ecosystem-app-whatsapp-channel); [Gulf News](https://gulfnews.com/business/markets/salik-is-now-on-whatsapp-what-changes-for-dubai-toll-gate-users-1.500311864).
- The Parkin app lets users find parking, schedule payments up to 30 days ahead, start and end sessions, manage time remotely, use a wallet, view history, handle fines and log in with UAE Pass — [App Store description](https://apps.apple.com/ae/app/id6657993734).
- The RTA Dubai app covers on- and off-street parking and permits, driving-licence renewal and vehicle-test booking — [App Store description](https://apps.apple.com/ae/app/id426109507). RTA's Dubai Drive app offers Salik recharge, vehicle management, violations and disputes, and paying traffic, parking and Salik fines in one place — [Property Finder blog, Dubai Drive](https://propertyfinder.ae/blog/dubai-drive-app).
- DubaiNow covers Salik top-ups, fine payments, car registration renewal, and buying or renewing car insurance — [Dubizzle blog: DubaiNow for car owners](https://www.dubizzle.com/blog/cars/dubainow-app).

**Most common complaints (UAE App Store most-recent reviews, accessed 6 Nov 2026)**
- **Smart Salik:**
  - "adding vehicles is a nightmare" (14 Oct 2026)
  - "Link to UAE PASS doesn't work" (10 Oct 2026)
  - "No login possible since months" (3 Aug 2026)
  - "Please have a version… without constant updates… We just want to pay for Salik" (4 Aug 2026)
  - A cost complaint: "I live in Jumeirah, I have 2 cars, and I am paying daily almost 60-80 AED, it's around 24000 AED a year" (2 Oct 2026)
  
  — [App Store UAE, Smart Salik](https://apps.apple.com/ae/app/smart-salik/id912158362)
- **Parkin:**
  - "constantly glitching, especially when extending tickets… shows no active tickets or treats me as a guest" (4 Nov 2026)
  - "every time it takes me more than 5 minutes to buy a ticket" (31 Oct 2026)
  - subscription payment "technical error… customer support says it takes 5 days" (31 Oct 2026)
  - "My dispute was rejected… Even if you only stop for 3 seconds… you get fined" (27 Oct 2026)
  - "no call center" (3 Nov 2026)
  - A user claims the fine went from Dh100 to Dh150 (4 Nov 2026; user claim, unverified)
  
  — [App Store UAE, Parkin](https://apps.apple.com/ae/app/id6657993734)
- **RTA Dubai:**
  - "I payed twice… the amount was 7 dhs but I was charged 15dhs" (28 Oct 2026)
  - forced updates "every 3 days" (13 Oct 2026)
  - "new update does not keep the vehicle plates" (1 Oct 2026)
  - "Incorrect Salik Violations" (29 Sep 2026)
  
  — [App Store UAE, RTA Dubai](https://apps.apple.com/ae/app/id426109507)
- Residents in 2025 reported that more gates and variable pricing raised monthly travel costs, and that peak-hour parking charges were also a concern — [Khaleej Times, 2025](https://www.khaleejtimes.com/uae/transport/dubai-salik-commute-costs-increase).

**Current tariffs (for the "save money" maths)**
- Salik: peak Dh6 (6–10am and 4–8pm), low-peak Dh4 (10am–4pm and 8pm–1am), free 1–6am (as of 1 Nov 2026) — [Gulf News](https://gulfnews.com/uae/dubai/dubai-ride-2026-saliks-variable-toll-rates-on-nov-1-when-dh6-and-dh4-charges-apply-1.500730149). With 5% VAT from 1 June 2026, these are about Dh6.30 and Dh4.20 — [Khaleej Times](https://www.khaleejtimes.com/uae/transport/salik-announces-5-vat-from-june-1-on-toll-tariff-tag-activation); [YallaMotor](https://www.yallamotor.com/news/salik-vat-uae-2026-5-percent-tolls-parking-55390).
- Parkin's variable parking, as announced: Dh6/hour for premium spaces and Dh4/hour for other paid spaces at 8–10am and 4–8pm, with off-peak unchanged — [Gulf News](https://gulfnews.com/uae/transport/variable-salik-and-parking-rates-in-dubai-what-it-means-to-you-1.104784384) (2026 hours unconfirmed). VAT was added to parking and cash meters were phased out from 1 Jun 2026. SMS, nol, the Parkin app, DubaiNow and the RTA app remain, and Parkin steers users to its app to avoid SMS surcharges — [Gulf News](https://gulfnews.com/uae/transport/dubai-paid-parking-update-parkin-to-apply-5-vat-from-june-1-1.500549597); [Khaleej Times](https://www.khaleejtimes.com/uae/transport/dubai-phase-out-cash-payments-parking-metres-june-1-2026).

### Inferences
- The official apps' low ratings come from execution failures (logins, vehicle add, glitches), not missing features. A third party cannot fix those, because payments, disputes and vehicle linking all happen on official rails.
- "Warn me about fines" and "remind me of renewals" are already covered by Salik notifications, Salik WhatsApp insurance reminders, Parkin and RTA apps, DubaiNow and Dubai Police. Feature-wise, Idea B's differentiation reduces to "one cost dashboard across all of them plus optimisation tips".
- The time-shift saving is small per crossing: about Dh2.10 (Dh6.30 vs Dh4.20). The free window (1–6am) is impractical for most commuters.

### Gaps
- I found no Google Play review text, only iOS.
- The current 2026 Parkin peak hours and tariffs for every zone were not confirmed on parkin.ae.
- I did not check whether Google Maps or Waze show Salik toll costs or toll-avoiding routes in Dubai. If they do, that would further weaken the route-suggestion feature.

---

## B2. Idea B: are Salik, Parkin or RTA data or APIs available to third parties, and is scraping or account linking legally possible?

### Takeaway
No public consumer-data API exists for Salik, Parkin or RTA. Salik integrates only through negotiated B2B partnerships (parking operators, valet, malls). RTA's open-data page is just PDFs. Linking accounts by logging in with a user's UAE Pass or Salik credentials, or scraping the portals, is legally risky under Article 2 of the UAE cybercrime law: unauthorised access to an information system carries AED 100k–300k and/or imprisonment. The only safe data routes are on the user's side (manual entry, pasted bank SMS, phone location), which new indie apps already use.

### Cited Findings
- Searches turned up no public Salik API or developer programme. Salik's integrations are partnerships. Parkonic signed a five-year contract under which "Parkonic will pay Salik a percentage of its parking revenues generated specifically through the Salik eWallet", using plate detection — [Gulf News](https://gulfnews.com/business/markets/dfm-listed-salik-expands-reach-outside-dubai-in-deal-with-parkonic-1.1732770271969); [Parkonic FAQ](https://parkonic.com/faq). Other partners are Valtrans (valet at 100+ sites from June 2026) — [Zawya](https://www.zawya.com/en/business/transport-and-logistics/salik-valtrans-to-launch-digital-valet-parking-payment-service-on-1-june-ffmp4zbe), Emaar Malls (barrier-free parking) — [Gulf News](https://gulfnews.com/living-in-uae/transport/where-you-can-use-salik-to-pay-for-parking-in-the-uae-1.500198394), and Shamal at Dubai Harbour (July 2026) — [DFM disclosure, 13 Jul 2026](https://feeds.dfm.ae/documents/2026/Jul/13/cc114d4f-e457-4b07-9569-dc5d8b06cdb4/Salik%20X%20Shamal%20Mou%20ENG.Pdf.pdf).
- RTA's Open Data page lists only PDF documents (annual reports, statistics 2011–2016, a fines booklet, legislation). It has no datasets for parking zones or Salik gates, no API, and no named licence, and it points to Dubai Pulse for data requests — [RTA Open Data](https://rta.ae/wps/portal/rta/ae/home/open-data) (fetched 6 Nov 2026).
- Federal Decree-Law No. 34 of 2021, Article 2, criminalises accessing a website, information system or network without permission. The penalty is imprisonment and/or a fine of AED 100,000–300,000, and higher bands apply for aggravated cases — [Gulf News, UAE Public Prosecution](https://gulfnews.com/uae/uae-public-prosecution-warns-against-hacking-electronic-crimes-1.89202848); [Clyde & Co, 2022](https://www.clydeco.com/en/insights/2022/03/uae-updates-cybercrime-law). How it applies to automated scraping or consented credential use is untested, and I found no English-language case law — [Chambers](https://chambers.com/articles/data-infringement-alert-cybercrimes-and-penalties-in-the-uae) (commentary).
- Third-party apps that rely on official SMS short-codes are fragile:
  - A 4 Nov 2026 Prkn review (in Arabic) reports the app showed a message that it "no longer works with Dubai parking (مواقف دبي)" — [App Store UAE, Prkn](https://apps.apple.com/ae/app/id1476142724).
  - An Aug 2026 review says that when the user called to dispute a fine, they were told Prkn "is an unofficial app" — [App Store UAE, Prkn](https://apps.apple.com/ae/app/id1476142724).
  - Parkin is steering users away from SMS to its own app — [Gulf News](https://gulfnews.com/uae/transport/dubai-paid-parking-update-parkin-to-apply-5-vat-from-june-1-1.500549597).
- The new indie car-cost apps avoid official integration entirely:
  - MySayara: "Bank texts become expenses: paste the text message… or use the iPhone Shortcut" and "Not affiliated with the RTA, Salik, Parkin or any bank" — [App Store UAE, MySayara](https://apps.apple.com/ae/app/id6821332460).
  - Benzeen: "Toll gates you pass are counted and priced with the current tariffs, including Salik peak hours", using on-device location — [App Store UAE, Benzeen_](https://apps.apple.com/ae/app/id6816716627).

### Inferences
- Without official access, the app cannot automate renewals or payments, which are part of the brief's "automating renewals". It can only remind users and deep-link to the official apps.
- Location-based gate detection plus bank-SMS parsing gives roughly 80–90% cost visibility without any official data. iOS cannot read SMS automatically (hence MySayara's paste or Shortcut workaround), so iOS onboarding friction is high. Android can read SMS but faces Google Play's restricted-permission policy, which I did not verify.
- Salik and Parkin control the rails and are actively building partner ecosystems. A consumer app with no partnership would always be one tariff or SMS-format change away from breaking, as Prkn's Dubai issue suggests.

### Gaps
- I did not check Dubai Pulse for RTA, Parkin or Salik datasets (gate locations, parking zones), because Dubai Pulse returned 503.
- I did not research Salik corporate or fleet account statement exports (CSV or API), which would matter for a fleet pivot.
- I did not research the UAE PDPL (Federal Decree-Law 45/2021) implications of processing bank SMS and location data, or Google Play's SMS-permission policy.

---

## B3. Idea B: do aggregator or car-services apps already cover this?

### Takeaway
Yes, and the space is getting crowded fast. Two indie UAE car-cost trackers, MySayara and Benzeen, launched in October 2026, both free, covering fuel, Salik with peak pricing, parking, fines and renewal reminders. Shory dominates insurance comparison (4.79★ iOS / 4.90★ Play). Salik itself is expanding into parking, valet, fuel (ENOC), EV charging and insurance reminders. Indie SMS-parking apps (Prkn, 4.69★ from 21k ratings) show that a better-UX layer can win users, but those apps monetise through ads and sit on fragile rails.

### Cited Findings
- **MySayara: Car Expense Tracker** (released 22 Oct 2026, 0 ratings, free, no ads): tracks fuel, Salik, parking, service, insurance, registration and car loan; gives monthly projections, cost per km and EV charging; reminds before Mulkiya, insurance and service are due; turns bank SMS into expenses; shows official fuel prices; supports up to 3 cars; Arabic and English — [App Store UAE](https://apps.apple.com/ae/app/id6821332460).
- **Benzeen_: UAE Fuel & Car Costs** (released 15 Oct 2026, 1 rating, free): detects fuel stops at ADNOC, ENOC and Emarat, auto-counts and prices Salik and Darb gates including peak hours, gives service reminders, scans the VIN or Mulkiya, tracks fines with early-payment discounts, sends a weekly report, keeps data on the device, and has widgets — [App Store UAE](https://apps.apple.com/ae/app/id6816716627).
- **Prkn** (indie, released 2019): **4.69★ from 21,347 ratings**. It pays parking by SMS across emirates and reminds users 15 minutes before expiry. A 2026 review asks how to get rid of the in-app ads — [App Store UAE](https://apps.apple.com/ae/app/id1476142724). **UAE Parking** (indie): **4.66★ from 1,996 ratings** — [App Store UAE](https://apps.apple.com/ae/app/id1621840721).
- **Shory Insurance:** **4.79★ from 2,469 ratings** on iOS; **4.90★ from 1,327** on Google Play, 100K+ installs — [App Store UAE](https://apps.apple.com/ae/app/id1601026503); [Google Play](https://play.google.com/store/apps/details?id=com.shory.app&hl=en&gl=ae). **Policybazaar UAE:** **1.81★ from 86 ratings** on iOS, with complaints about delayed policy issuance and refunds — [App Store UAE](https://apps.apple.com/ae/app/id1498734317).
- **CAFU** (fuel and car service delivered): **4.57★ from 11,203 ratings**. **ADNOC Dist:** 3.35★ (2,392). **ENOC Pay:** 1.58★ (259) — [iTunes Search API, country=ae](https://itunes.apple.com/search?term=cafu&country=ae&entity=software) (accessed 6 Nov 2026).
- Salik's ecosystem push:
  - The Liva insurance partnership (Nov 2024), in which Salik "will use its database to send timely reminders" for insurance and registration renewal — [Khaleej Times](https://khaleejtimes.com/business/auto/salik-to-offer-vehicle-insurance-services-in-new-partnership-with-liva?amp=1); [Dubai Media Office](https://mediaoffice.ae/en/news/2024/november/13-11/salik-partners-with-liva).
  - H1 2026 priorities are EV charging (Schneider Electric, Vcharge) and "seamless fuel and services payments through Enoc" — [Khaleej Times, 5 Aug 2026](https://www.khaleejtimes.com/business/saliks-h1-profits-drop-87-as-fines-number-of-trips-decline).
  - Parking via Parkonic at 135,000+ spaces in 107 locations — [Gulf News](https://gulfnews.com/business/markets/dfm-listed-salik-expands-reach-outside-dubai-in-deal-with-parkonic-1.1732770271969).

### Inferences
- The "car running-cost dashboard" is now a commodity feature that two solo developers shipped in the same month the founder is evaluating it. Being third or fourth to market with a free tracker gives no defensible edge.
- Salik is turning itself into the default car wallet (tolls, parking, valet, fuel, EV, insurance reminders), with 2.9M accounts. A third-party "optimiser" sits on top of a platform that is absorbing its features.
- The only proven indie success pattern (Prkn, UAE Parking) is "simplify a painful official payment flow". It is monetised with ads, and the official operators can cut it off at will.

### Gaps
- I have no download or revenue data for MySayara, Benzeen, Prkn or UAE Parking.
- I did not verify whether Shory or other insurers pay affiliate or referral fees to apps, or whether CBUAE insurance-broker licensing applies to a referral link.

---

## B4. Idea B: how many vehicles and drivers are in Dubai, and is there evidence of willingness to pay?

### Takeaway
The market is large: Salik has 2.9M active accounts, about 4.6M Salik-registered vehicles UAE-wide, and Dubai added 196k vehicles in H1 2026. But the average Salik account spends only about Dh69 a month on tolls, residents already time-shift without an app (free trips +46.8% in Q2 2025), and every car-cost app found is free. There is no evidence that drivers pay for an optimiser.

### Cited Findings
- Salik H1 2026:
  - Revenue was Dh1.412bn (−7.5%) and profit Dh704m (−8.7%).
  - Total trips were 383.8m (−9.5%), of which 278.5m were chargeable: **102.9m at peak (Dh6)** and 146.2m off-peak (Dh4).
  - Toll usage fees were Dh1.2025bn (−11.4%), and fines revenue rose 7.5% to Dh144.4m.
  - **Active accounts: 2.9 million.**
  
  — [Khaleej Times, 5 Aug 2026](https://www.khaleejtimes.com/business/saliks-h1-profits-drop-87-as-fines-number-of-trips-decline).
- Salik active registered vehicles (UAE-wide) rose from 4.17m (June 2024) to 4.56m (June 2025), and to 4.65m by Q3 2025 — [Khaleej Times](https://www.khaleejtimes.com/uae/transport/traffic-390000-vehicles-roads-12-months); [What's On](https://whatson.ae/2025/08/dubai-traffic-jumps-390000-new-vehicles-hit-the-roads-in-12-months/).
- More than 196,000 new vehicles were registered in Dubai in H1 2026, over 1,000 a day — [Gulf News](https://gulfnews.com/uae/transport/dubai-registers-196000-new-vehicles-in-six-months-more-than-1000-a-day-1.500713093). RTA says about 3.5 million vehicles are on Dubai's roads in the daytime — [Dubai Eye 103.8](https://www.dubaieye1038.com/news/local/3-5-million-vehicles-use-dubais-roads-daily-registrations-up-10/). Registered vehicles in Dubai's commercial transport sector passed 500,000, up 25% YoY — [Gulf News, 2025](https://gulfnews.com/uae/transport/dubai-commercial-transport-sector-grows-40-in-2025-1.500447668).
- Residents already optimise without help. Post-1am toll-free trips rose **46.8% to 16.4 million in Q2 2025** against Q1, and one commuter waits 15–20 minutes to cross after 1am: "This saves me Dh8 a day" — [Khaleej Times, 18 Aug 2025](https://www.khaleejtimes.com/uae/dubai-free-salik-trips-up-nearly-50-in-q2-amid-residents-tactics-to-save-on-tolls).
- Heavy-user pain is real but anecdotal: one user pays Dh60–80 a day for 2 cars (about Dh24k a year) — [App Store UAE, Smart Salik review, 2 Oct 2026](https://apps.apple.com/ae/app/smart-salik/id912158362).
- Every comparable consumer car app found is free: MySayara (free, no ads), Benzeen (free), Prkn (free with ads), and the official apps — [App Store UAE listings above](https://apps.apple.com/ae/app/id6821332460).

### Inferences
- Average toll spend: Dh1.2025bn ÷ 2.9m accounts ÷ 6 months ≈ **Dh69 per account per month** (my calculation; accounts can hold several vehicles, and fleets skew the mean upward, so the median private driver probably spends less). The Dh550+ bills in the brief are a heavy-user tail, not the norm.
- Peak trips were 37% of chargeable trips in H1 2026 (102.9 ÷ 278.5). Moving all of a typical account's peak trips to Dh4.20 would save roughly Dh10–15 a month (my rough estimate), which is too little to support a subscription.
- Fines (Dh144m in H1 for Salik alone, growing) are the larger avoidable cost per incident: a single parking fine is Dh150 according to a user claim. But fine prevention mostly means parking-expiry reminders, which Parkin and Prkn already provide.
- A possibly stronger segment is SME fleets: commercial vehicles passed 500k, up 25%. Toll and fine reconciliation per driver is a B2B pain with budget, but it hits the same data-access wall (see B2 gaps).

### Gaps
- There is no official RTA 2025 year-end count of registered vehicles or licensed drivers in Dubai. A "2.5m registered in Dubai in 2024" figure surfaced but could not be tied to a primary source.
- There are no surveys on drivers' willingness to pay for a cost-optimiser app in the UAE.
- I have no per-account distribution of Salik spend (median vs mean) and no share of accounts held by fleets.

---

## B5. Idea B verdict: go, maybe or no-go?

### Takeaway
**NO-GO as a consumer Salik/parking/running-cost optimiser.**
- **Main risk:**
  - No data access: there is no API, and credential-based account linking is exposed to cybercrime-law risk.
  - A platform owner (Salik, 2.9M accounts) is absorbing parking, fuel, EV and insurance-reminder features.
  - Two free indie clones launched in October 2026.
  - Optimisation savings are small for the average driver (about Dh2.10 per crossing; about Dh69 a month average toll spend).
- **Main reason it could work:** the official Salik and Parkin apps are rated about 2★ on iOS with bug-driven complaints, and indie parking apps (Prkn, 4.69★/21k) prove that drivers adopt a simpler third-party layer.
- **Most plausible model, if pursued at all:** a free, ad- or affiliate-supported app (insurance via a licensed partner such as Shory, plus car-service referrals), or a pivot to SME fleet toll and fine reconciliation, which first needs a Salik or RTA corporate-data partnership.

### Cited Findings
- Official apps already cover alerts, history, fines, renewals and insurance — [Smart Salik App Store](https://apps.apple.com/ae/app/smart-salik/id912158362); [Dubizzle DubaiNow guide](https://www.dubizzle.com/blog/cars/dubainow-app); [ARY News, Salik WhatsApp insurance reminders](https://arynews.tv/salik-digital-ecosystem-app-whatsapp-channel).
- There is no public Salik API; integrations are B2B revenue-share deals — [Gulf News, Parkonic deal](https://gulfnews.com/business/markets/dfm-listed-salik-expands-reach-outside-dubai-in-deal-with-parkonic-1.1732770271969).
- Unauthorised-access penalty: AED 100k–300k and/or imprisonment — [Gulf News, Public Prosecution](https://gulfnews.com/uae/uae-public-prosecution-warns-against-hacking-electronic-crimes-1.89202848).
- Free indie competitors launched in October 2026 — [MySayara](https://apps.apple.com/ae/app/id6821332460); [Benzeen_](https://apps.apple.com/ae/app/id6816716627).
- The proven indie UX play is Prkn, 4.69★ from 21,347 ratings — [App Store UAE](https://apps.apple.com/ae/app/id1476142724).
- Salik: 2.9M accounts, Dh1.2bn H1 toll fees, ecosystem expansion — [Khaleej Times, 5 Aug 2026](https://www.khaleejtimes.com/business/saliks-h1-profits-drop-87-as-fines-number-of-trips-decline).

### Inferences
- If the founder still wants a car product, the least-bad wedge is "parking-fine prevention plus a one-tap pay flow". It has the clearest, most frequent pain (Parkin UX), but it depends on SMS or official rails that Parkin is actively deprecating. That makes it a hobby-scale, ad-revenue product, not a business.
- Compared with Idea A, Idea B scores lower on data access, legal risk, competitive density and willingness to pay. Idea A's data is open and its legal position clearer. Its weakness is monetisation, which a referral model can partly address; Idea B's weaknesses are structural.

### Gaps
- Fleet-pivot viability (Salik corporate statements, RTA fleet APIs) was not researched.
- Insurance affiliate economics and licensing were not researched.
