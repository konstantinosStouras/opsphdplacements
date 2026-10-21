// Dated manual transcription of opened primary sources; performs no retrieval.
// One-time append only. Unavailable people receive explicit blocked observations, not invented jobs.
import fs from 'node:fs';
const base='research-handoff/careers', day='2026-10-21';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const write=(f,x)=>fs.writeFileSync(f,JSON.stringify(x,null,2)+'\n');
const assignment=read(`${base}/batches/${day}-104-128-assignment.json`);
const observations=[];
function add(order,url,identity,jobs,unknowns=[],mentions=[],sourceType='official-profile',failures=[]) {
  observations.push({order,sourceUrl:url,identityBasis:identity,jobs,unknowns,mentions,sourceType,failures});
}
const b='https://www.business.rutgers.edu/sites/default/files/documents/faculty/cv-alok-baveja.pdf';
add(104,b,'Rutgers institutional CV matches Alok Baveja, SUNY Buffalo industrial engineering/operations research doctorate (1993), and Rutgers career.',[
 ['Rutgers Business School, Newark and New Brunswick','Professor','2015','Present'],
 ['Rutgers Business School','Director of Strategy and Innovation','2020','Present'],
 ['Rutgers Business School','Interim Department Chair','1/1/2016','6/30/2017'],
 ['Rutgers Business School','Interim Department Vice Chair','2019',null],
 ['Rutgers University, Camden','Professor','2008','2015'],
 ['Rutgers University, Camden','Associate Professor','2000','2008'],
 ['Rutgers University, Camden','Assistant Professor','1994','2000'],
 ['Rutgers Global Health Institute','Core Faculty','2020','Present'],
 ['Institute for Health, Health Care Policy and Aging Research, Rutgers University','Associate Faculty','2018','Present'],
 ['Center for Supply Chain Management, Rutgers University','Academic Director','2016','2017'],
 ['Center for Supply Chain Management, Rutgers University','Research Faculty Fellow','2013','Present'],
 ['CAIT / Maritime Infrastructure Engineering and Management Program, Rutgers University','Affiliated Faculty','2006','Present']
],['CV issue date is not established. Present means current in that CV, not independently confirmed through October 2026. Administrative/service chronology beyond the read appointments is partial.'],[
 'Dean’s Research Professorship, 2019–2022, is a concurrent distinction; not counted as an additional primary job.',
 'Virtua Health board governance committee 2013–2019 and nominating committee 2011–2018 are service mentions.',
 'National Institute of Justice crime-rate grant, 1998–2002, lists Sub-Contractor/Consultant; exact contracting employer and term unknown. Roshni Rides advisor mentioned for 2017.'
],'cv');
const g='https://carlsonschool.umn.edu/sites/carlsonschool.umn.edu/files/faculty-cvcs/alok-gupta-cv.pdf';
add(105,g,'Minnesota CV identifies the UT Austin management science/information systems doctorate (1996), UConn/Minnesota chronology and Wolfgang Ketter/Eric van Heck research links matching the RSM visiting-professor profile. RSM dates remain unknown.',[
 ['University of Minnesota, Carlson School of Management','Academic Director, Master in Applied Business Analytics','2024','Present'],
 ['University of Minnesota, Carlson School of Management','Senior Associate Dean of Faculty, Research and Administration','January 2015','June 2024'],
 ['University of Minnesota, Carlson School of Management','Curtis L. Carlson Schoolwide Chair in Information Management','2008','Present'],
 ['University of Minnesota, Carlson School of Management','Department Chair, Information and Decision Sciences','July 2006','September 2014'],
 ['University of Minnesota, Carlson School of Management','Carlson Endowed Professor, Information and Decision Sciences','2005','2008'],
 ['University of Minnesota, Carlson School of Management','Professor, Information and Decision Sciences','2005','Present'],
 ['University of Minnesota, Carlson School of Management','Academic Director, Carlson Consulting Enterprise','July 2004','June 2006'],
 ['University of Minnesota, Carlson School of Management','Associate Professor, Information and Decision Sciences','2001','2005'],
 ['University of Connecticut','Assistant Professor, Operations and Information Management','1997','2001'],
 ['University of Connecticut','Visiting Assistant Professor, Operations and Information Management','1996','1997'],
 ['University of Minnesota','Publisher, MIS Quarterly','August 2004','present'],
 ['University of Connecticut and General Electric joint initiative','Executive Committee Member, edgeLab','January 2000','July 2001'],
 ['University of Connecticut','Co-director, Treibick Electronic Commerce Initiative','August 1999','July 2001'],
 ['Rotterdam School of Management, Erasmus University Rotterdam','Visiting Professor',null,null,'https://www.rsm.nl/people/alok-gupta/']
],['CV summary lists chair 2005–2014; detailed section distinguishes ad-hoc chair in 2005 from July 2006–September 2014. Treibick fundraising began in 1998; the detailed co-director appointment says August 1999–July 2001. CV issue date and visiting-professor dates unknown.'],[
 'Ad-hoc department chair in 2005 precedes the detailed chair interval; not counted twice.',
 'Professional service: ISR editor in chief 2017–2022; senior editor 2008–2015; INFORMS publication committee 2016–2017; Management Science special-issue department editor 2012–2014.'
],'cv');
add(106,'https://www.lancaster.ac.uk/lums/people/alp-arslan','Exact Lancaster individual faculty profile, logistics/supply-chain subject and institution match the imported person; doctorate and prior institutions were not independently reconfirmed in the opened biography.',[
 ['Lancaster University','International Lecturer (Assistant Professor) in Logistics and Supply Chain Management',null,null]
],['Thin official biography: doctorate, appointment dates and earlier employment not stated. ORCID required JavaScript; no employment data read there.']);
add(107,'https://oid.wharton.upenn.edu/profile/alpsungu/','Wharton individual profile and author-owned alpsungu.com page agree on name, Operations/Information/Decisions field and Penn affiliation; doctorate not established by the opened sources.',[
 ['University of Pennsylvania, Wharton School','Assistant Professor of Operations, Information and Decisions',null,null]
],['Appointment dates, doctorate and earlier jobs unknown. Linked Dropbox CV returned no readable content; no full CV or LinkedIn Experience review completed.'],[],'official-profile',['https://www.dropbox.com/scl/fi/w55kkww2uv2eb18qfd58b/CV_ASungu.pdf?dl=0&rlkey=wpd368120xdhfepj0iyyv4rb3']);
add(109,'https://www.alysliang.com/','Author biography matches McGill individual faculty profile and Michigan Technology and Operations doctorate, explicitly completed in 2024; official education range alone was not treated as conferral.',[
 ['McGill University, Desautels Faculty of Management','Assistant Professor of Retail and Operations Management',null,null]
],['Job start date and prior roles not provided by these biographies. Hands-on doctoral work does not establish a separate employer or paid role.'],['Biography mentions doctoral work with stores, fulfilment centres, warehouses and data science teams, without identifiable employment dates or titles.'],'personal-profile');
add(112,'https://emse.mst.edu/facultystafffacilities/emsefaculty/index.html','Exact Missouri S&T faculty-directory entry matches the roster person, engineering management department and individual-profile identifier. The linked individual profile was unavailable; doctorate/earlier chronology remains unconfirmed in opened evidence.',[
 ['Missouri University of Science and Technology','Department Chair of Engineering Management and Systems Engineering (EMSE)',null,null],
 ['Missouri University of Science and Technology','Graduate Program Director',null,null],
 ['Missouri University of Science and Technology','Bernard R. Sarchet Endowed Professor of Engineering Management',null,null]
],['Directory-only capture. The 2024 appointment story appeared in search results but failed to open; its dates and earlier jobs were not promoted to verified evidence.'],[],'official-profile',['https://mst.elsevierpure.com/en/persons/amaury-lendasse','https://news.mst.edu/2024/05/amaury-lendasse-named-chair-of-engineering-management-and-systems-engineering-at-missouri-st/']);
const a='https://directory.smeal.psu.edu/download/jpa5602-vita.pdf';
add(113,a,'Penn State-hosted Johanna Amaya CV states RPI transportation-engineering PhD in May 2016 and matches the faculty identifier and Iowa State/Penn State chronology.',[
 ['Penn State University','Assistant Professor','Since 2021',null],
 ['Iowa State University','Assistant Professor','2016','2021'],
 ['Rensselaer Polytechnic Institute','Postdoctoral Research Associate','May 2016','Aug. 2016'],
 ['Rensselaer Polytechnic Institute','Graduate Research Assistant','2012','2016'],
 ['Universidad del Norte','Adjunct Professor','2011','2012'],
 ['University of Florida','Student Assistant','2009','2010'],
 ['Universidad del Norte','Lecturer','2005','2008'],
 ['Inverpal, Colombia','Finance and Administrative Manager','2004','2005'],
 ['Muebles Jamar, Colombia','Customer Service Coordinator','2001','2002']
],['CV has no established issue date. Since 2021 is retained without manufacturing an end date. Earlier jobs and student roles do not by themselves resolve degree/job ordering.'],[
 'Additional course delivery: Universidad Externado de Colombia Summer 2025; ESPOL Winter 2024; Universidad Distrital Francisco José de Caldas Summer 2023; Universidad del Valle Summer 2019; Universidad Nacional Bogotá Summer 2016. Titles/contract terms unspecified.',
 'University of Florida teaching assistance: Advanced Production and Inventory Control Spring 2010; Deterministic Operations Research Fall 2009, potentially overlapping the Student Assistant entry.',
 'NSF Panel Fellow Cohort 2, 2021–2022, is listed as training; paid employment is not established.'
],'cv');
add(114,'https://www.scu.edu/business/undergraduates/news/2023-24/faculty-spotlight-amber-xiaoyan-liu-isa-department-.html','Official faculty profile identifies Cornell OTIM PhD completed in 2021; March 2024 faculty spotlight explicitly says Santa Clara joined in 2021.',[
 ['Santa Clara University, Leavey School of Business','Assistant Professor, Information Systems & Analytics','2021',null]
],['Earlier jobs and precise appointment dates unknown. A bulletin search result gives a conflicting doctorate year; no doctorate dataset correction is made from that result.']);
const r='https://aminrahimian.github.io/Amin_Rahimian_CV.pdf';
add(115,r,'September 2026 author CV and Pitt individual profile match Penn Electrical and Systems Engineering doctorate, MIT postdoc and Pitt industrial engineering affiliation.',[
 ['University of Pittsburgh','Assistant Professor (Tenure Stream), Department of Industrial Engineering','2020',null],
 ['University of Pittsburgh','Affiliated Faculty, Intelligent Systems Program (ISP)','2023',null],
 ['University of Pittsburgh','Affiliated Faculty, Institute for Cyber Law, Policy and Security (Pitt Cyber)','2020',null],
 ['Massachusetts Institute of Technology','Digital Fellow, MIT Initiative on the Digital Economy (IDE), MIT Sloan School of Management','2020',null],
 ['Massachusetts Institute of Technology','Postdoctoral Associate, MIT Institute for Data, Systems, and Society & MIT Sloan School of Management','2017','2020'],
 ['University of Pennsylvania','Teaching assistant & staff to Prof. Santosh S. Venkatesh — ESE 530','Fall 2013','Fall 2015'],
 ['University of Pennsylvania','Teaching assistant & staff — ENM 503','Summer 2013','Summer 2014'],
 ['University of Pennsylvania','Teaching assistant & staff — ESE 301','Spring 2013','Spring 2016'],
 ['University of Pennsylvania','Teaching assistant & staff — Probability (Coursera)','2013','2015']
],['CV updated September 2026. Seasonal course offerings are intermittent, not continuous employment. Open-ended dashes do not supply explicit Present dates. Education 2012–2017 is a range, not a new conferral conclusion.'],[
 'Pitt course creator/sole instructor: IE1171 Fall 2022–present; IE3080 Fall 2023–present; IE1072 Spring 2021–present; IE2117 Spring 2024–present; IE2007 Spring 2023 and planned 2027; IE2084 Fall 2021 and 2022. These are duties within the faculty appointment.',
 'Pitt Sociotechnical Systems Research Lab leadership is described on the official biography; start unspecified.',
 'CV mentions invited book-proposal consultant, Cambridge University Press, 2021, and Alliance for Advancing Health Online / Vaccine Confidence Fund advisory council, 2021; scope/paid status unknown.'
],'cv');
add(116,'https://freemannews.tulane.edu/2022/08/16/freeman-welcomes-5-to-faculty-for-2022-23','Tulane biography and dated hire announcement match ASU Management of Information Systems doctorate and Freeman appointment.',[
 ['Tulane University, A. B. Freeman School of Business','Assistant Professor of Management Science','July 1, 2022',null]
],['Dated announcement establishes appointment effective July 1, 2022; later promotions and pre-doctoral work not covered.']);
add(117,'https://rbs.uir.ac.ma/amine-belhadi/','Rabat Business School individual biography explicitly identifies Cadi Ayyad doctorate and industrial engineering expertise, matching the imported person.',[
 ['Rabat Business School','Associate Professor',null,null],
 ['OCP group','engineer',null,null],
 ['OCP group','consultant',null,null]
],['Biography says more than eight years of OCP practice, without dates or separate durations for engineer/consultant. Roles may overlap; no sector duration calculated.']);
const n='https://aminebennouna.com/files/Amine_CV.pdf';
add(118,n,'Author CV and biography match MIT OR doctorate, Bart Van Parys advisor, MIT postdoc and Kellogg appointment; biography explicitly says PhD completed in 2024.',[
 ['Kellogg School of Management, Northwestern University','Assistant Professor of Operations','2025',null],
 ['Laboratory for Information & Decision Systems, MIT','Postdoctoral Researcher','2024','2025'],
 ['MIT','Head teaching assistant, Optimization Methods','Fall 2021',null],
 ['MIT','Teaching assistant, Optimization Methods','Fall 2020',null],
 ['MIT','Guest Lecturer, The Analytics Edge','Fall 2023',null],
 ['MIT','Guest Lecturer, The Advanced Analytics Edge','Fall 2023',null],
 ['Morocco’s national team IMO training','Mathematical Olympiad, Instructor','2017','2019'],
 ['Institut Bossuet (Lycée Louis-le-Grand, Saint-Louis, Henri IV)','Instructor and examiner, Advanced Mathematics, Classes Préparatoires',null,null],
 ['Google Research','Research Intern','Summer 2022',null],
 ['Google Research','Research Intern','Summer 2023',null],
 ['Crédit Agricole Investement Bank','Data scientist intern','Summer 2018',null]
],['CV issue date not established. Summer/Fall entries are finite seasonal engagements with no invented month/day or continuous duration. Institut Bossuet dates unknown.'],[
 'Co-founder and president of Math&Maroc 2016–2019; MIT ORC seminar coordinator Spring 2023 are service/outreach mentions; paid status unspecified.'
],'cv');
add(119,'https://rbs.uir.ac.ma/mohamed-amine-masmoudi/','Official Rabat individual profile gives the expanded name Mohamed Amine Masmoudi, Sfax doctorate and OR/production management field.',[
 ['Rabat Business School','Assistant Professor of supply chain management',null,null]
],['Appointment dates and earlier career not stated in this opened biography. No inference from current role to first job.']);
const d='https://amirbrd.rbind.io/files/amir-cv.pdf';
add(120,d,'Author CV matches Hebrew University OR doctorate with Nicole Adler, MIT and Rotman postdocs, and Hebrew University Business School appointment.',[
 ['Hebrew University Business School','Assistant Professor (Tenure Track), Department of Operations Research','2025',null],
 ['Massachusetts Institute of Technology','Research Affiliate, Intelligent Transportation Systems (ITS) Laboratory','2024',null],
 ['University of Toronto, Rotman School of Management','Postdoctoral Researcher','2024','2025'],
 ['Massachusetts Institute of Technology','Postdoctoral Researcher, Intelligent Transportation Systems (ITS) Laboratory','2023','2024'],
 ['Hebrew University Business School','Lecturer','2016',null],
 ['The Jerusalem College of Engineering','Teaching Fellow and Course Instructor','2008','2022'],
 ['The Jerusalem College of Engineering','Lecturer','2011','2017'],
 ['The Jerusalem College of Engineering','Academic Supervisor for Final Projects','2011','2017'],
 ['Israel Ministry of Transport','Transportation policy advisor; strategic national parking committee member','2021','2022'],
 ['municipalities and government officials','Transportation policy advisor on parking policies','2018','2022'],
 ['The Jerusalem College of Engineering','System Analysis and Data Team Leader','2010','2016'],
 ['The Jerusalem College of Engineering','Information Systems and Data Analysis Engineer','2007','2010']
],['CV issue date and doctorate completion date not stated. Open-ended appointments and overlaps retained; advisory paid status unknown. Teaching training certificate is not employment.'],[],'cv');
add(121,'https://www.concordia.ca/faculty/amirhossein-hosseinipour.html','Exact Concordia individual faculty identifier, supply-chain department and stated Business Administration PhD match the roster context; conferring institution/year are absent.',[
 ['Concordia University','Assistant Professor, Supply Chain and Business Technology Management',null,null]
],['Biography section is empty. Doctorate institution/year, job dates and previous employers unknown; no namesake CV linked.']);
add(122,'https://business.utsa.edu/faculty/profiles/karimi-amir.html','UTSA individual profile states Minnesota PhD and healthcare/supply-chain research matching the imported person.',[
 ['The University of Texas at San Antonio','Assistant Professor, Operations and Analytics',null,null],
 ['The University of Texas at San Antonio','Alvarez Research Fellow',null,null]
],['Dates and earlier employment unknown. Prior handoff reports a SharePoint CV login restriction; no attempt to bypass or retrieve around it. Fellowship may be concurrent distinction, not a separate primary job.']);
const p='https://kedge.edu/content/download/76481/file/PIRAYESH%20Amir%20CV%20AACSB%2012-2021.pdf';
add(123,p,'KEDGE-linked December 2021 CV states ENSAM Industrial & Mechanical Engineering doctorate (2014); current KEDGE biography confirms same doctorate and INTEROP/ENSAM chronology.',[
 ['KEDGE BUSINESS SCHOOL','Assistant Professor of Operations & Supply Chain Management',null,null],
 ['INTEROP-VLab','Researcher','2014','2016'],
 ['Ecole Nationale Supérieure d’Arts et Métiers (ENSAM), ParisTech','Attaché Temporaire d’Enseignement et de Recherche (ATER)','2013','2014'],
 ['KEDGE Business School','professeur associé en Operations and Supply Chain Management',null,null,'https://kedge.edu/annuaire/amir-pirayesh']
],['Historical CV title differs from current French biography title; promotion date unknown. ATER and Research and Teaching Assistant appear over the same 2013–2014 interval and are not counted twice. Teaching activity years do not establish appointment boundaries.'],[
 'CV also labels ENSAM 2013–2014 Research and Teaching Assistant, potentially a translation/overlap of ATER.',
 'KEDGE courses and Bachelor supply-chain specialty responsibility 2018–2021; ENSAM/ITII courses 2011–2012, 2012–2013 and 2013–2014. Contract/title details unspecified.',
 'Current biography identifies SOECOVAC project leadership, without appointment dates.'
],'cv');
add(124,'https://business.gmu.edu/profiles/aalamdar','George Mason individual biography matches UMass Amherst management-science doctorate and named prior Lehigh/Adelphi roles.',[
 ['George Mason University, Costello College of Business','Instructional Assistant Professor, Information Systems and Operations Management',null,null],
 ['Lehigh University','visiting assistant professor',null,null],
 ['Adelphi University, Robert B. Willumstad School of Business','assistant professor of decision sciences',null,null]
],['No appointment or doctorate dates in opened biography. Instructional title is explicit; research cessation is not inferred.']);
const z='https://business.rice.edu/sites/default/files/uploads/cv/Pazgal_CV-1_3.pdf';
add(125,z,'Rice-hosted November 2015 CV identifies Northwestern PhD (1997), Rice and Washington University chronology, matching Amit I. Pazgal.',[
 ['Rice University, Jesse H. Jones Graduate School of Business','Professor of Marketing','2011',null],
 ['Rice University, Jesse H. Jones Graduate School of Business','Associate Professor of Management and Marketing','2006','2011'],
 ['Washington University in St. Louis, John M. Olin School of Business','Associate Professor of Marketing','2002','2006'],
 ['Washington University in St. Louis, Olin Digital Commerce Center','Associate Director','2002','2006'],
 ['Washington University in St. Louis, John M. Olin School of Business','Assistant Professor of Marketing','1997','2002'],
 ['Contxt','Co-founder','2000','2002'],
 ['Pazim (Computers) Ltd.','Pricing, Scheduling and sales forecasting','1996','2004'],
 ['Scheduling Technology Group','Pricing','1998','1999'],
 ['Creative Output Inc.','Management consulting','1993','1997'],
 ['Israeli Defense Forces','Officer (rank upon separation - Captain)','1987','1992'],
 ['GE Oil & Gas','Marketing & Pricing Consulting','2011','2012']
],['CV updated November 2015: later chronology unverified. Header says Professor of Marketing and Operations Management, while appointment list says Professor of Marketing; title history is not inferred.'],[
 'Shorter consulting projects: Ameritech, STG-UK, Bynet, Bank Leumi-Israel, Australian Post Office, Influence, ESCO; dates and titles unspecified.',
 'Advisory boards: Garden Click and Influence Incubator; leadership council KETC Channel 9/St Louis PBS 1999–2006. Paid employment not established.'
],'cv');
add(127,'https://business.gmu.edu/profiles/adutta','Mason individual profile states Purdue MIS doctorate, Mason joined 1992 and previous Iowa/Rochester affiliations; matches the roster identifier.',[
 ['George Mason University','Professor, Information Systems and Operations Management',null,null],
 ['George Mason University','area chair of information systems and operation management',null,null],
 ['George Mason University','LeRoy Eakin Endowed Chair in electronic commerce',null,null],
 ['University of Iowa','faculty position',null,null],
 ['University of Rochester, Simon School','faculty position',null,null],
 ['Technical University of Darmstadt','visiting professor',null,null],
 ['Indian Institute of Management Calcutta','visiting professor',null,null],
 ['Korea Advanced Institute of Science and Technology, Electronic Commerce Research Center','international research fellow',null,null]
],['Joined Mason in 1992 does not establish the start of every current title. Earlier faculty ranks, visit dates and doctorate year unknown; recently is relative to an undated biography.'],['Mason institutional joining year: 1992. Consulting and training for unnamed government/private organisations is mentioned without job details.']);
add(128,'https://research.monash.edu/en/persons/amrik-sohal/','Monash individual profile matches Bradford Operations Management doctorate and Monash management affiliation.',[
 ['Monash University, Department of Management','Professor',null,null]
],['No appointment start, promotions or earlier employment stated in opened Monash biography. Publication/activity years are not employment dates. A supplementary author biography was denied by robots policy and was not retried.'],['ANZAM board membership for over ten years and president during 2009 are professional service, not established paid jobs.'],'official-profile',['https://theconversation.com/profiles/amrik-sohal-1226720']);
const blocked=[
 [108,'https://directory.smeal.psu.edu/axa60','Official directory redirected to an unavailable new page. Other official results did not open. Search-result biography is a lead, not a verified employment history.'],
 [110,'https://engineering.louisville.edu/industrial/personnel/faculty/','Official Louisville directory did not open. An ERAU CV for Aman Gupta was read and describes Louisville PhD/appointments, but linkage to this specific directory identity remains insufficient; candidate roles withheld pending disambiguation.'],
 [111,'https://www.iimb.ac.in/user/135/amar-sapra','Official profile, faculty booklet and seminar page returned 403. Search results are retained only as leads; no newly opened employment evidence.'],
 [126,'https://www.hbs.edu/faculty/Profile%20Files/Chandra%20CV%20January%201%202026_1bb00f0a-cef4-4793-88d9-2de7a9270b68.pdf','Harvard CV/profile sources were unavailable (403/404/502). Search-result chronology was not treated as opened evidence.']
];
const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function date(s){let y=s?.match(/\b(?:19|20)\d{2}\b/),m=null;if(y){const i=months.indexOf(s.slice(0,3).toLowerCase());if(i>=0)m=i+1;const d=s.match(/^(\d{1,2})\/\d{1,2}\/\d{4}$/);if(d)m=+d[1];}return {asWritten:s,year:y?+y[0]:null,month:m,precision:y?(m?'month':'year'):'unknown'};}
const records=assignment.records.map(person=>{
 const o=observations.find(x=>x.order===person.order), blockedRow=blocked.find(x=>x[0]===person.order);
 if(!o&&!blockedRow)throw Error(`Missing observation ${person.order}`);
 const limitations=o?['This is partial source coverage, not a complete real-world career or first-job conclusion.',...o.unknowns]:[blockedRow[2]];
 return {id:person.id,name:person.name,recordIds:[person.id],checkedAt:day,reviewer:'Codex',reviewStatus:o?'partial':'blocked',
 identityBasis:o?.identityBasis||'Existing stable database identity retained; new source/degree matching could not be completed. No namesake merged.',
 coverageNote:o?'Partial employment history. '+limitations.join(' '):'Source access blocked: no newly verified job history. '+blockedRow[2],
 jobs:(o?.jobs||[]).map(([employer,title,start,end,url])=>({employerAsWritten:employer,titleAsWritten:title,start:date(start),end:date(end),isCurrent:/^present$/i.test(end||'')?true:end?false:null,sourceType:url?'official-profile':o.sourceType,sourceUrl:url||o.sourceUrl,checkedAt:day,evidenceNote:'Opened '+(o.sourceType==='cv'&&!url?'CV appointment/experience entry':'individual institutional/author biography')+'. Original date precision and overlaps retained; undated/open-ended entries do not establish continuous employment through the check date.'})),
 otherEmploymentMentions:(o?.mentions||[]).map(note=>({sourceUrl:o.sourceUrl,checkedAt:day,evidenceNote:note})),remainingUnknowns:limitations,
 accessLimitations:o?(o.failures||[]).map(url=>'No readable chronology obtained: '+url):['Unavailable source: '+blockedRow[1]]};
});
// Locations explicitly printed alongside these CV appointment/internship entries.
const bennounaLocations={0:'Evanston, IL',1:'Cambridge, MA',8:'New York, NY',9:'New York, NY',10:'Singapore'};
const bennouna=records.find(h=>h.id==='omlist-d64f17846bee0cb0');
for(const [index,location] of Object.entries(bennounaLocations))bennouna.jobs[Number(index)].locationAsWritten=location;
if(records.length!==25)throw Error('Expected 25 outcomes');
if(process.argv.includes('--integrate')){
 const pub=read('data/employment-histories.json'), ids=new Set([...pub.records,...read('data/linkedin-histories.json').records].flatMap(x=>[x.id,...x.recordIds||[]]));
 for(const h of records)if(ids.has(h.id))throw Error('Refusing overwrite '+h.id);
 pub.records.push(...records);write('data/employment-histories.json',pub);
}
for(const h of records){const file=h.id.replaceAll(':','_'),o=observations.find(x=>assignment.records.find(p=>p.id===h.id).order===x.order),bl=blocked.find(x=>assignment.records.find(p=>p.id===h.id).order===x[0]);
 write(`${base}/histories/${file}.json`,h);
 write(`${base}/reviews/${file}.json`,{id:h.id,name:h.name,status:h.reviewStatus,checkedAt:day,reason:h.coverageNote,sourceUrls:[...new Set([...(h.jobs||[]).map(j=>j.sourceUrl),...(h.otherEmploymentMentions||[]).map(j=>j.sourceUrl),...(o?[o.sourceUrl,...o.failures]:[bl[1]])])],nextStep:'Obtain newer/full readable primary chronology and resolve listed identity/date/source gaps. Never infer first job or continuity.',integrationStatus:process.argv.includes('--integrate')?'Integrated source observations and explicit blockers in data/employment-histories.json':'Reviewed proposal; not yet public'});
}
write(`${base}/batches/${day}-104-128-observations.json`,{checkedAt:day,records});
console.log(JSON.stringify({people:records.length,partial:records.filter(h=>h.reviewStatus==='partial').length,blocked:records.filter(h=>h.reviewStatus==='blocked').length,jobs:records.reduce((n,h)=>n+h.jobs.length,0),mentions:records.reduce((n,h)=>n+h.otherEmploymentMentions.length,0)}));
