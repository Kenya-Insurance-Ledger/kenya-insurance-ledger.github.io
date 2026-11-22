import asyncio
from playwright.async_api import async_playwright
URL='http://127.0.0.1:8766/index.html'
R=[]
def ok(n,c,d=''):
    R.append((n,bool(c))); print('PASS' if c else 'FAIL',n,d)
async def goto(pg,h):
    await pg.evaluate(f"location.hash='#{h}'"); await pg.wait_for_timeout(250)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        errs=[]
        for w,h,tag in [(1280,900,'desk'),(390,844,'mob')]:
            pg=await b.new_page(viewport={'width':w,'height':h})
            pg.on('pageerror',lambda e,tag=tag:errs.append(f'{tag} pageerror {e}'))
            pg.on('console',lambda m,tag=tag:errs.append(f'{tag} console {m.text}') if m.type=='error' and 'fonts.g' not in m.text and 'net::' not in m.text else None)
            await pg.goto(URL); await pg.wait_for_selector('text=Largest by share',timeout=15000)
            for v in ['overview','classes','insurers','performance','claims','toolkit','sources']:
                await goto(pg,v)
                sw=await pg.evaluate('document.documentElement.scrollWidth')
                if sw>w+2: errs.append(f'{tag} {v} overflow {sw}')
                await pg.screenshot(path=f'/home/claude/qa/v4-{tag}-{v}.png')
            if tag=='mob':
                await goto(pg,'performance')
                for t in ['Historical tracker','Rankings','Market share','Reconciliation & audit']:
                    await pg.get_by_role('tab',name=t).click(); await pg.wait_for_timeout(300)
                    sw=await pg.evaluate('document.documentElement.scrollWidth')
                    if sw>w+2: errs.append(f'mob perf {t} overflow {sw}')
                    await pg.screenshot(path=f'/home/claude/qa/v4-mob-{t[:6]}.png',full_page=True)
                continue
            # classes
            await goto(pg,'classes')
            ok('14 codes', await pg.locator('tr[data-code]').count()==14)
            avi=await pg.locator('tr[data-code="01"] td.count').inner_text()
            ok('Aviation computed = 19', '19 of 35' in avi, avi)
            c11=await pg.locator('tr[data-code="11"]').inner_text()
            ok('Class 11 legal name', "Workmen’s Compensation and Employer’s Liability Insurance" in c11 and 'Work Injury Benefits' not in c11)
            c08=await pg.locator('tr[data-code="08"]').inner_text()
            ok('PSV nested under 08', 'PSV (statistical sub-line)' in c08)
            # overview
            await goto(pg,'overview'); t=await pg.inner_text('main')
            ok('Both stat-mgmt dates', '10 Mar 2026' in t and '11 Mar 2026' in t)
            ok('PCF shield', await pg.locator('svg[aria-labelledby="pcfT pcfD"]').count()==1 and 'KSh 500,000' in await pg.locator('svg[aria-labelledby="pcfT pcfD"]').text_content())
            ok('Banner present', '3 data gaps pending' in t)
            # directory
            await goto(pg,'insurers'); t=await pg.inner_text('main')
            ok('Lineage SVG', await pg.locator('svg[aria-labelledby="linT linD"]').count()==1)
            ok('Status filters', all(s in t for s in ['Active','Statutory management','Under receivership','Run-off','Historical / merged']))
            await pg.get_by_role('button',name='FY 2025 GWP').click() if await pg.get_by_role('button',name='FY 2025 GWP').count() else await pg.locator('th:has-text("FY 2025 GWP")').click()
            await pg.wait_for_timeout(150)
            first=await pg.locator('main tbody tr').first.inner_text()
            ok('Sort by GWP', 'CIC' in first, first[:50])
            await pg.fill('#gsearch','UAP'); await pg.wait_for_timeout(200)
            gr=await pg.inner_text('#gresults'); ok('Search former name UAP','Old Mutual General' in gr)
            await pg.locator('#gresults button').first.click(); await pg.wait_for_timeout(300)
            dr=await pg.inner_text('[role=dialog]')
            ok('UAP alias REPORTED (no primary notice)', 'UAP Insurance / UAP Old Mutual' in dr and 'link reported' in dr)
            ok('Contacts with source links', 'oldmutual.co.ke' in dr)
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(150)
            await pg.fill('#gsearch','Jubilee Allianz'); await pg.wait_for_timeout(200)
            ok('Jubilee Allianz -> Sanlam Allianz','SanlamAllianz' in await pg.inner_text('#gresults'))
            await pg.fill('#gsearch','Allianz Kenya'); await pg.wait_for_timeout(200)
            ok('Allianz Kenya separate historical','Historical' in await pg.inner_text('#gresults'))
            await pg.fill('#gsearch','')
            # compare + radar
            await goto(pg,'insurers')
            boxes=pg.locator('input[aria-label^="Compare "]')
            for i in range(4): await boxes.nth(i).click(); await pg.wait_for_timeout(80)
            ok('Max 3 compare', '3/3' in await pg.get_by_role('button',name='Compare (3/3)').inner_text())
            await pg.get_by_role('button',name='Compare (3/3)').click(); await pg.wait_for_timeout(300)
            await pg.get_by_role('tab',name='Radar profile').click(); await pg.wait_for_timeout(600)
            ok('Radar renders', await pg.locator('svg[aria-label^=Radar] circle').count()>=1)
            await pg.screenshot(path='/home/claude/qa/v4-desk-radar.png')
            for tname in ['Business profile','Contacts','Financial']:
                await pg.get_by_role('tab',name=tname).click(); await pg.wait_for_timeout(150)
            ok('Compare tabs', 'Gross premium income' in await pg.inner_text('[role=dialog]'))
            await pg.keyboard.press('Escape')
            # tracker gaps
            await goto(pg,'performance'); await pg.get_by_role('tab',name='Historical tracker').click(); await pg.wait_for_timeout(300)
            await pg.select_option('#trCid','trident'); await pg.wait_for_timeout(400)
            paths=await pg.evaluate("[...document.querySelectorAll('[data-testid=tracker-chart] .recharts-line-curve')].map(p=>p.getAttribute('d'))")
            ok('Gaps not joined (multiple segments)', paths and paths[0].count('M')>=2, str([x.count('M') for x in paths]))
            await pg.screenshot(path='/home/claude/qa/v4-desk-tracker.png')
            # rankings
            await pg.get_by_role('tab',name='Rankings').click(); await pg.wait_for_timeout(300)
            hd=await pg.inner_text('[data-testid=rank-header]'); ok('Rank header X of 35', 'of 35 licensed insurers had comparable data' in hd, hd)
            await pg.select_option('#rkMetric','cr'); await pg.wait_for_timeout(200)
            await pg.select_option('#rkPer','2024 Q3'); await pg.wait_for_timeout(300)
            await pg.locator('[data-testid=rank-excluded] summary').click()
            ex=await pg.inner_text('[data-testid=rank-excluded]'); ok('Disputed excluded with reason','Faulty return flagged' in ex, ex[:160].replace('\n',' '))
            await pg.screenshot(path='/home/claude/qa/v4-desk-rank.png',full_page=True)
            # share
            await pg.get_by_role('tab',name='Market share').click(); await pg.wait_for_timeout(300)
            await pg.select_option('#shPer','2025 Q1'); await pg.wait_for_timeout(300)
            t=await pg.inner_text('main'); ok('Verified Q1 2025 leaders','Old Mutual General Insurance 9.4%' in t and 'APA Insurance 8.9%' in t and 'GA Insurance 8.9%' in t)
            await pg.get_by_role('button',name='KSh billions').click(); await pg.get_by_role('button',name='Treemap').click(); await pg.wait_for_timeout(400)
            ok('Treemap renders', await pg.locator('.recharts-treemap-depth-1').count()>0 or await pg.locator('.recharts-surface rect').count()>5)
            await pg.screenshot(path='/home/claude/qa/v4-desk-share.png',full_page=True)
            # recon
            await pg.get_by_role('tab',name='Reconciliation & audit').click(); await pg.wait_for_timeout(400)
            t=await pg.inner_text('main'); ok('Recon numbers','224.24' in t and '225.38' in t and '225.39' in t and '205.03' in t and '227.17' in t)
            ok('Recon chart', await pg.locator('[data-testid=recon-chart] .recharts-bar-rectangle').count()>=6)
            await pg.locator('details summary:has-text("Record a resolution")').first.click()
            await pg.locator('[data-testid=resolve-R1]').click(); await pg.wait_for_timeout(150)
            ok('Resolution blocked without justification', not await pg.evaluate("JSON.parse(localStorage.getItem('kgii3.resolutions')||'{}').R1"))
            await pg.screenshot(path='/home/claude/qa/v4-desk-recon.png',full_page=True)
            # import
            await goto(pg,'sources'); await pg.get_by_role('tab',name='Import data').click(); await pg.wait_for_timeout(200)
            csv='''entity,period,metric,value,unit,page_ref,source_document,source_url,status
CIC General Insurance Limited,FY2025,Claims Paid,"12,450,000,000",KES,Table 9 p.31,IRA claims statistics,https://www.ira.go.ke/x,VERIFIED
CIC General,FY2025,Net Written Premium,15000000,KES_000,p.5,Doc,https://www.ira.go.ke/y,REPORTED
CIC General,FY2025,Capital Adequacy Ratio,180,pct,p.7,Doc,https://www.ira.go.ke/y,REPORTED
CIC General,FY2025,Gross Written Premium,30000,KES_m,p.5,Doc,https://www.ira.go.ke/y,REPORTED
Nonexistent Co,2025,Profit Before Tax,55,KES_m,,x,,REPORTED
'''
            await pg.fill('#impText',csv); await pg.get_by_role('button',name='Parse & map columns').click(); await pg.wait_for_timeout(200)
            await pg.click('[data-testid=validate]'); await pg.wait_for_timeout(200)
            t=await pg.inner_text('[data-testid=imp-result]')
            ok('Raw vs converted','12,450,000,000 KES' in t and 'KSh 12.45 bn' in t, )
            ok('Errors: unknown entity / missing URL','does not match any insurer' in t and 'missing source URL' in t)
            ok('Conflict vs panel','competing' in t)
            await pg.click('[data-testid=confirm]'); await pg.wait_for_timeout(200)
            n=await pg.evaluate("JSON.parse(localStorage.getItem('kgii3.imported')).length"); ok('4 imported',n==4,str(n))
            await pg.fill('#impText','entity,period,metric,value,unit,page_ref,source_document,source_url,status\nCIC General Insurance Limited,FY2025,Claims Paid,13000000000,KES,p.32,IRA rev,https://www.ira.go.ke/z,VERIFIED\n')
            await pg.get_by_role('button',name='Parse & map columns').click(); await pg.wait_for_timeout(150); await pg.click('[data-testid=validate]'); await pg.wait_for_timeout(150)
            ok('Overwrite needs approval', await pg.locator('[data-testid=confirm]').is_disabled())
            await pg.click('[data-testid=approve]'); await pg.click('[data-testid=confirm]'); await pg.wait_for_timeout(200)
            sup=await pg.evaluate("JSON.parse(localStorage.getItem('kgii3.superseded')).map(r=>r.raw+'|'+r.status)")
            ok('Archived as SUPERSEDED', any('12,450,000,000|SUPERSEDED' in x for x in sup), str(sup))
            # ranking for imported claims paid
            await goto(pg,'performance'); await pg.get_by_role('tab',name='Rankings').click(); await pg.wait_for_timeout(200)
            await pg.select_option('#rkMetric','cpaid'); await pg.wait_for_timeout(200)
            ok('Imported claims paid ranked','1 of 35 licensed insurers had comparable data' in await pg.inner_text('main'))
            # pdf extractor stepper + checker gate
            await goto(pg,'sources'); await pg.get_by_role('tab',name='IRA PDF extractor').click(); await pg.wait_for_timeout(200)
            ok('PDF stepper', 'Review & correct' in await pg.inner_text('main'))
            # legal
            await pg.get_by_role('tab',name='Legal library').click(); await pg.wait_for_timeout(200)
            t=await pg.inner_text('main'); ok('Invesco 14 Aug 2024 in legal','14 Aug 2024' in t); ok('Legal type badges', all(x in t for x in ['Statute','Regulation','Guidance','Practice','Court Decision']))
            await pg.get_by_role('tab',name='Pipeline & data model').click(); await pg.wait_for_timeout(200)
            ok('Pipeline SVG','Superseded history log' in await pg.inner_text('main'))
            # backup
            await pg.get_by_role('button',name='Backup').click(); await pg.wait_for_timeout(200)
            bk=await pg.input_value('textarea[aria-label="Backup JSON"]'); ok('Backup JSON includes imports','"imported"' in bk and 'kenya-general-insurance-intelligence' in bk)
            await pg.keyboard.press('Escape')
            # ---- v4 ----
            await goto(pg,'overview')
            vc=await pg.inner_text('[data-testid=verify-card]')
            ok('v4 Verify card on Overview','*352#' in vc and 'Insurance agent' in vc and 'Insurance broker' in vc)
            hrefs=await pg.eval_on_selector_all('[data-testid=verify-card] a','els=>els.map(e=>e.href)')
            ok('v4 Verify card IRA links', 'https://ira.go.ke/licensed-insurance-agents/' in hrefs and 'https://www.ira.go.ke/licensed-insurance-brokers/' in hrefs and 'https://ira.go.ke/licensed-intermediaries/' in hrefs, str(hrefs))
            ok('v4 Unconfirmed IRA link flagged','link not confirmed' in vc)
            await pg.reload(); await pg.wait_for_selector('text=Largest by share',timeout=15000)
            await goto(pg,'insurers')
            ok('v4 Verify card on Insurers', await pg.locator('[data-testid=verify-card]').count()==1)
            await pg.click('[data-testid=mode-cards]'); await pg.wait_for_timeout(150)
            tot=0
            for _ in range(8):
                tot+=await pg.locator('[data-testid=contact-grid] [data-testid^=contact-]').count()
                nb=pg.get_by_role('button',name='Next')
                if await nb.is_disabled(): break
                await nb.click(); await pg.wait_for_timeout(100)
            nf=await pg.evaluate("(()=>{const g=document.querySelectorAll('[data-testid=contact-grid] [data-testid^=contact-]');return [...g].every(c=>c.querySelectorAll('[data-field]').length===4)})()")
            ok('v4 Contact cards for every general record (4 fields)', tot==44 and nf, str(tot))
            await goto(pg,'overview'); await goto(pg,'insurers'); await pg.click('[data-testid=mode-cards]'); await pg.wait_for_timeout(100)
            await pg.fill('input[aria-label="Search insurers"]','Cannon'); await pg.wait_for_timeout(150)
            cc=await pg.inner_text('[data-testid=contact-grid]')
            ok('v4 Cannon sourced pending phone','info@cannon.co.ke' in cc and 'pending verification' in cc.lower())
            ok('v4 Empty fields say Not yet sourced','Not yet sourced' in cc)
            await pg.fill('input[aria-label="Search insurers"]','Kenindia'); await pg.wait_for_timeout(150)
            card=pg.locator('[data-testid=contact-grid] [data-testid^=contact-]').first
            tid=await card.get_attribute('data-testid'); iid=tid[8:]
            await pg.click(f'[data-testid=ve-{iid}-phone]')
            await pg.fill('input[aria-label="Customer care phone value"]','+254 700 000 000')
            await pg.fill('input[aria-label="Source URL"]','not-a-url')
            await pg.get_by_role('button',name='Save stamp').click(); await pg.wait_for_timeout(100)
            ok('v4 Stamp requires https source', await pg.locator('input[aria-label="Source URL"]').count()==1)
            await pg.fill('input[aria-label="Source URL"]','https://example.org/contact')
            await pg.get_by_role('button',name='Save stamp').click(); await pg.wait_for_timeout(150)
            t=await card.inner_text()
            ok('v4 Stamp shows verified by you','+254 700 000 000' in t and 'verified by you' in t.lower(), t[:120])
            ls=await pg.evaluate("localStorage.getItem('kgii3.contactEdits')")
            ok('v4 Stamp persisted', ls and 'example.org' in ls)
            await pg.get_by_role('button',name='Backup').click(); await pg.wait_for_timeout(200)
            bk=await pg.input_value('textarea[aria-label="Backup JSON"]'); ok('v4 Backup includes contact stamps','contactEdits' in bk and 'example.org' in bk)
            await pg.keyboard.press('Escape')
            # recon domain auto: max tick > 250 not required; check bars start at 0
            await goto(pg,'performance'); await pg.get_by_role('tab',name='Reconciliation & audit').click(); await pg.wait_for_timeout(300)
            ticks=await pg.eval_on_selector_all('[data-testid=recon-chart] .recharts-yAxis .recharts-cartesian-axis-tick-value','els=>els.map(e=>e.textContent)')
            ok('v4 Recon y-axis from 0 auto', ticks and ticks[0].strip() in ('0','0bn') and ticks[-1]!='250bn', str(ticks))
            await pg.get_by_role('tab',name='Rankings').click(); await pg.wait_for_timeout(200)
            await pg.select_option('#rkPer','2024 Q4'); await pg.wait_for_timeout(200)
            hd=await pg.inner_text('[data-testid=rank-header]'); ok('v4 Rank header FY2025 count', '(34 for FY 2025)' in hd, hd)
            # compare hash share
            idx=await pg.evaluate("1")
            await pg.evaluate("location.hash='#compare-0-1-2'"); await pg.wait_for_timeout(400)
            ok('v4 Hash opens compare', await pg.locator('[data-testid=cmp-heads] > div').count()==3)
            ok('v4 Compare class tags', await pg.locator('[data-testid=cmp-classes] span').count()>3)
            await pg.get_by_role('tab',name='Contacts').click(); await pg.wait_for_timeout(150)
            ok('v4 Compare contact cards', await pg.locator('[data-testid=cmp-contacts] [data-testid^=contact-]').count()==3)
            await pg.get_by_role('tab',name='Radar profile').click(); await pg.wait_for_timeout(150)
            ok('v4 Compare radar present', await pg.locator('[data-rows] svg').count()==1)
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(150)
            ok('v4 Close resets hash', await pg.evaluate('location.hash')=='#insurers')
            # banner dismiss
            await goto(pg,'overview'); await pg.get_by_role('button',name='Dismiss pending-ingestion banner').click(); await pg.wait_for_timeout(150)
            ok('Banner dismissible', '3 data gaps pending' not in await pg.inner_text('main'))
            # feed validation
            await pg.get_by_role('button',name='Show all 12').click(); await pg.wait_for_timeout(100)
            ok('Feed items all dated+sourced', await pg.locator('main ol li time').count()==12)
            await pg.evaluate('localStorage.clear()')
        ok('No runtime errors / overflow', not errs, '; '.join(errs[:6]))
        await b.close()
    print(f"{sum(1 for r in R if r[1])}/{len(R)} passed")
asyncio.run(main())
