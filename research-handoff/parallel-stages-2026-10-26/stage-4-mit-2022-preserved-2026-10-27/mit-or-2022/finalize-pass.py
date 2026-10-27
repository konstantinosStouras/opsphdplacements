"""Refresh only this research lane's portable summaries. No public/Git writes."""
import json, hashlib
from pathlib import Path
P=Path(__file__).resolve().parent
def read(f): return json.loads((P/f).read_text(encoding='utf-8'))
def write(f,d): (P/f).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
co=read('cohort-proposal.json')
jon=next(r for r in co['records'] if r['name']=='Jonathan Paynter')
jon['careerOwner']='stage-3'
jon['identityStatus']='Official Army author biography names Jonathan/Jon Paynter, West Point mathematical sciences assistant professor/deputy head, and MIT OR doctorate; career review deferred.'
co['limitations'][2]='Four existing OM List faculty careers deferred to Stage 2; Jonathan Paynter faculty career deferred to Stage 3. All 13 remaining graduate professional cases attempted with explicit outcomes.'
co['sourceScope']='All 18 expanded 2022 PhD thesis entries read; masters excluded. Recipient books 2022/2023 read at relevant OR doctoral entries.'
write('cohort-proposal.json',co)
iv=read('ivan-spassimirov-paskov.history-proposal.json')
iv['identityBasis']='Official advisor Bertsimas page directly links this exact LinkedIn profile beside Ivan Paskov, Stable Machine Learning, 2022. Identity matched; self-reported Applied Mathematics field conflicts with official OR award and is retained separately.'
iv['identitySources']=['https://dbertsim.mit.edu/students?5f740517_page=2']
iv['remainingUnknowns']=[s.replace('professional identity remains provisional','professional identity advisor-linked') for s in iv['remainingUnknowns']]
iv['parkedCase']['reason']='No accessible Experience section or named employer. Advisor-linked profile labels education Applied Mathematics, unlike official Operations Research recipient; keep field conflict. First job unresolved.'
write('ivan-spassimirov-paskov.history-proposal.json',iv)
ted=read('theodore-p-papalexopoulos.history-proposal.json')
ted['identitySources']=['https://dbertsim.mit.edu/students?5f740517_page=2']
ted['identityBasis']+=' Exact advisor-linked old URL ted-papalexopoulos-066811126 opened in Chrome and redirects to ted-papalex, confirming same profile.'
write('theodore-p-papalexopoulos.history-proposal.json',ted)
faculty=[
 ('Jackie Baek','stage-2','omlist-417ab2226f530367','https://jwbaek.github.io/','Personal faculty biography confirms NYU and MIT OR doctorate with Farias. Official NYU page web-reader 403; personal biography and recipient identity read.'),
 ('Ryan Cory-Wright','stage-2','omlist-e57a518c6da1a693','https://profiles.imperial.ac.uk/r.cory-wright','Official Imperial profile confirms faculty identity and MIT OR study period 5 September 2017–21 May 2022. Study-period endpoint is not a formal award day.'),
 ('Michael Lingzhi Li','stage-2','omlist-7e1d12a95de6576c','https://aiinstitute.hbs.edu/our-team/michael-lingzhi-li/','Official Harvard team page confirms faculty identity, linked to existing OM List record. Formal February 2022 award separately verified.'),
 ('Holly Mika Wiberg','stage-2','omlist-428f45cb9e95b516','https://www.heinz.cmu.edu/faculty-research/profiles/wiberg-holly','Official CMU faculty page names MIT OR doctorate; recipient supplies full Holly Mika Wiberg identity and award year.'),
 ('Jonathan Paynter','stage-3',None,'https://www.armyupress.army.mil/Journals/Journal-of-Military-Learning/Journal-of-Military-Learning-Archives/JML-2026/Studying-Generative-AI/','Official Army article author biography actually read in Chrome identifies Jonathan/Jon Paynter, assistant professor and deputy head of West Point Mathematical Sciences, MIT OR doctorate. Web-reader 403 resolved via normal Chrome public page; no challenge bypass.')]
write('faculty-identity-deferrals.json',{'checkedAt':'2026-10-27','integrationStatus':'proposal-only','careersReviewedByStage4':False,'records':[{'name':n,'careerOwner':o,'existingPersonId':i,'sourceUrl':u,'checkedAt':'2026-10-27','evidenceNote':e} for n,o,i,u,e in faculty]})
hs=[read(f.name) for f in sorted(P.glob('*.history-proposal.json'))]
park=[{'personId':h['personId'],'name':h['name'],'reason':h['parkedCase']['reason'],'needed':'New individually dated completion or initial-employment evidence; do not infer from current role.','historyFile':next(f.name for f in P.glob('*.history-proposal.json') if read(f.name)['personId']==h['personId'])} for h in hs if h.get('parkedCase')]
months=[r['name'] for r in co['records'] if r['degreeAwardPeriod']['month'] is None]
write('parked-cases.json',{'checkedAt':'2026-10-27','cases':park,'formalAwardMonthUnknown':months,'directIndividualAwardDaysUnknown':[r['name'] for r in co['records']],'policy':'Bounded pass complete; slow cases parked for new evidence while cohort work continues. No claim all careers or dates resolved.'})
stats={'asOf':'2026-10-27','cohort':'mit-operations-research-phd:2022','status':'bounded-initial-pass-complete-with-explicit-gaps; proposal-only pending review','sightings':18,'recipientMatches':18,'formalAwardMonths':9,'formalAwardMonthsUnknown':9,'directAwardDaysUnknown':18,'stage4Histories':len(hs),'allAccessibleExperienceSectionsRead':sum(h['profileHistoryComplete'] for h in hs),'sourceRoleEntries':sum(len(h['jobs']) for h in hs),'supportingMentions':sum(len(h['otherEmploymentMentions']) for h in hs),'nonEmploymentExperienceEntries':sum(len(h.get('nonEmploymentExperienceEntries',[])) for h in hs),'firstEmployerProposals':sum(h['firstJobAssessment'] is not None for h in hs),'unresolvedFirstJobCases':len(park),'facultyCareerDeferrals':5,'careerComplete':False,'cohortCensusComplete':False,'parkedNames':[h['name'] for h in park],'files':'mit-or-2022/','nextAction':'Sole integrator reviews/publishes supported 2022 and pending 2023 findings, preserves frozen 2022 cut on GitHub, and reports release. Owner lookup/new evidence for eight parked first-job cases. Next unreviewed cohort MIT 2021.'}
write('progress.json',stats)
sources=[
 ('https://orc.mit.edu/research/phd-and-masters-theses/','Chrome','All 18 expanded 2022 PhD entries, no masters; source list not census.'),
 ('https://juan-pablo-vielma.github.io/jpv_cv.pdf','web PDF reader','Doctoral supervision section PDF page 14: Coey and Kapelevich completed PhD May 2022; advisor milestone, not formal award month.'),
 ('https://web.mit.edu/vivekf/www/students.html','web reader','Jackie and Patricio exact thesis/degree identities; Patricio Lyft destination and linked profile. Destination table alone not first-job proof.'),
 ('https://www.mit.edu/~cfogarty/Fogarty_CV.pdf','web PDF reader','Peter Cohen expected 2022 graduation; prospective only, no employment/completion inference.'),
 ('https://web.mit.edu/nitric/www/reshapingAllocation.pdf','web PDF reader','PDF page 26 Theodore Papalexopoulos MIT OR doctorate 2022 and organ-allocation thesis; affiliation not employment.'),
 ('https://www.hrsa.gov/sites/default/files/hrsa/optn/20230816_lung-ms.pdf','web PDF reader','PDF page 4 Ted Papalexopoulos under MIT Staff attendance; supporting affiliation only.'),
 ('https://dbertsim.mit.edu/students?5f740517_page=2','web reader and Chrome','Driss, Ivan and Ted exact thesis identities; Chrome read exact linked profile URLs. Ted old URL redirects to current profile.')]
write('source-audit.json',{'checkedAt':'2026-10-27','sources':[{'url':u,'readMethod':m,'checkedAt':'2026-10-27','supports':s} for u,m,s in sources]+[{'url':h['profileUrl'],'readMethod':'Individual Chrome profile and full accessible Experience detail' if h['profileHistoryComplete'] else 'Individual Chrome loaded profile (no Experience)' if 'linkedin.com' in h['profileUrl'] else 'Public personal professional page, entire biography read','checkedAt':'2026-10-27','supports':h['coverageNote']} for h in hs]+[{'url':u,'readMethod':'Chrome author biography' if n=='Jonathan Paynter' else 'Public primary professional page','checkedAt':'2026-10-27','supports':e} for n,o,i,u,e in faculty],'recipientBookMetadata':'recipient-source-metadata.json','limits':['No source caches/full PDFs/private contact details saved.','Existing DSpace human-verification and archive HTTP429 challenges remain unvisited, not bypassed.','Emma MIT News URL web cache miss: not verified or used.','Army PDF and web-reader article HTTP403: article subsequently read normally in Chrome; no PDF-source claim.','Qingyang linked personal site unavailable through web tool; no facts accepted from it.','All source role entries are observations, not necessarily paid jobs; student/status/volunteer/course/career-break distinctions retained.']})
readme='''# MIT Operations Research 2022 — bounded Stage 4 pass

All 18 names in the expanded official 2022 PhD thesis section were read and individually matched to doctoral recipient entries. Nine explicit formal award months (four February, five September) are established; nine months and all 18 direct individual award days remain unknown. Thesis issue months, study endpoints, advisor completion milestones and formal awards are separate. This is not an exhaustive cohort census.

Thirteen graduate career cases were attempted: ten entire accessible LinkedIn Experience sections, two partial personal biographies, and Ivan Paskov's loaded profile with no visible Experience. There are 69 source role entries, 11 supporting mentions and one separate nonemployment career break. Entry counts do not mean paid jobs or complete careers.

Five earliest documented post-PhD employer proposals: Chris Coey — MIT postdoc/research scientist (May 2022 biography, start unknown); Lea Kapelevich — MathWorks June 2022; Patricio Foncea-Araneda — Lyft October 2022; Emily Meigs — Convoy July 2022, with own May completion statement; Qingyang Xu — Meta October 2022, with own graduation/next-role and actual-start statements. Integrator must review the basis, especially Coey's partial 2022 biography.

Eight slow cases: Peter L. Cohen, Emma Gibson, Driss Lahlou Kitane, Ivan Spassimirov Paskov, Theodore P. Papalexopoulos, Omar Skali Lami, Matthew Sobiesk and Ioannis Spantidakis. See `parked-cases.json` for exact timing, identity-field or source gaps. No first-job conclusion is filled from a current employer.

Faculty careers deferred: Jackie Baek, Ryan Cory-Wright, Michael Lingzhi Li and Holly Wiberg to Stage 2; Jonathan Paynter to Stage 3. Stage 4 retains graduate/degree evidence only for those identities.

Pure proposals only. `validate-cohort.py` validates lane structure/precision; `publication-ready.json` freezes portable payload hashes. No public merger, shared generator, Git mutation or publication is run by this chat. The originating integrator alone reviews, transforms, stamps, commits/pushes and publishes. A GitHub snapshot is distinct from public integration; live-check proofs remain separate. Source URLs and retrieval metadata are preserved without full documents or private contact information.

MIT 2023 remains with the integrator for review; MIT 2024 slow cases remain parked for owner lookup. Next unreviewed cohort is MIT 2021 after this bounded pass. No automatic research continuation is promised.
'''
(P/'README.md').write_text(readme,encoding='utf-8')
for fn in ['progress.json','frontier.json','claims.json']:
 f=P.parent/fn;d=json.loads(f.read_text(encoding='utf-8'));d['mit2022Continuation']=stats;f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
root=P.parent/'README.md';s=root.read_text(encoding='utf-8');marker='## MIT 2022 continuation — 27 October 2026\n';s=s.split(marker)[0] if marker in s else s
root.write_text(s+'\n'+marker+'\nBounded pass covers all 18 thesis names and recipient matches; 13 career cases attempted, five first-employer proposals and eight parked cases. Nine formal months and all 18 direct award days remain unknown. Five faculty careers deferred. Details, sources, validation and frozen payload are in `mit-or-2022/`. Proposals await sole-integrator review/GitHub preservation/publication; MIT2023 remains in its separate reviewed cut. Next cohort MIT2021.\n',encoding='utf-8')
print(json.dumps(stats))
