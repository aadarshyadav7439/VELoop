import {ArrowLeft,ArrowRight,CheckCircle2,CircleHelp,Clock3,Coins,FileCheck,Gift,Info,LockKeyhole,MapPin,ShieldCheck,Trophy,Users,X} from "lucide-react";
import {useEffect,useState,useCallback} from "react";
import {Link,useParams,useSearchParams} from "react-router-dom";
import Countdown from "../../components/Countdown/Countdown";
import JoinConfirmation from "../../components/JoinConfirmation/JoinConfirmation";
import PrizeClaimModal from "../../components/PrizeClaimModal/PrizeClaimModal";
import GiveawayLoader from "../../components/GiveawayLoader/GiveawayLoader";
import {giveawayApi} from "../../services/giveawayApi";
import {resolvePrizeImage} from "../../utils/prizeAssets";
import {DEMO_MODES,GIVEAWAY_STATUS,formatCurrency} from "../../utils/giveawayStatus";
import useCountdown from "../../hooks/useCountdown";
import styles from "./Giveaway.module.css";

const FALLBACK_BALANCES={VEs:850,SVEs:1200,Tokens:5000};

export default function GiveawayDetails(){
 const {slug}=useParams();
 const [params,setParams]=useSearchParams();
 const requested=params.get('demo')||DEMO_MODES.DEFAULT;
 const mode=Object.values(DEMO_MODES).includes(requested)?requested:DEMO_MODES.DEFAULT;

 const [netState,setNetState]=useState('loading');
 const [prize,setPrize]=useState(null);
 const [siblingPrizes,setSiblingPrizes]=useState([]);
 const [event,setEvent]=useState(null);
 const [currentUser,setCurrentUser]=useState(null);
 const [participation,setParticipation]=useState({joined:false,entries:0,joinedPrizeIds:[]});
 const [myWin,setMyWin]=useState({won:false});
 const [myClaim,setMyClaim]=useState(null);

 const [confirm,setConfirm]=useState(false);
 const [joinLoading,setJoinLoading]=useState(false);
 const [joinError,setJoinError]=useState("");
 const [success,setSuccess]=useState(false);
 const [claimOpen,setClaimOpen]=useState(false);

 const load=useCallback(async()=>{
  setNetState('loading');
  try{
   const [detail,me]=await Promise.all([giveawayApi.getPrize(slug),giveawayApi.me().catch(()=>null)]);
   setPrize(detail.prize);
   setSiblingPrizes(detail.siblingPrizes||[]);
   setEvent(detail.giveaway);
   setCurrentUser(me);
   if(me){
    const status=await giveawayApi.getMyStatus(detail.giveaway.id).catch(()=>({joined:false,entries:0,joinedPrizeIds:[]}));
    setParticipation(status);
    if(detail.giveaway.status==='ended'){
     const win=await giveawayApi.getMyWin(detail.giveaway.id).catch(()=>({won:false}));
     setMyWin(win);
     if(win.won&&win.prize?.id===detail.prize.id){
      const claim=await giveawayApi.getMyClaim(detail.giveaway.id).catch(()=>null);
      setMyClaim(claim);
     }
    }
   }
   setNetState('ready');
  }catch{
   setNetState('error');
  }
 },[slug]);

 useEffect(()=>{load()},[load]);

 const countdown=useCountdown(event?.endAt||Date.now());
 const status=!event?null:mode==='upcoming'?GIVEAWAY_STATUS.UPCOMING:([DEMO_MODES.ENDED,DEMO_MODES.WINNER,DEMO_MODES.NON_WINNER].includes(mode)||countdown.expired?GIVEAWAY_STATUS.ENDED:event.status==='upcoming'?GIVEAWAY_STATUS.UPCOMING:GIVEAWAY_STATUS.ACTIVE);
 const auth=mode==='visitor'?false:['newuser','participant','winner','nonwinner'].includes(mode)?true:Boolean(currentUser);
 const joined=mode==='participant'||mode==='winner'||(mode==='default'&&prize&&participation.joinedPrizeIds?.includes(prize.id));

 if(netState==='error') return <main className={styles.page}><div className={styles.container}><div className={styles.emptyState}><span className={styles.kicker}>VELOOP REWARDS</span><h1>We couldn't load this giveaway.</h1><p>Something interrupted the request. Please try again.</p><button className={styles.cta} onClick={load}>Try again <ArrowRight size={15}/></button></div></div></main>;
 if(netState==='loading') return <main className={styles.page}><div className={styles.container}><div className={styles.detailNav}><Link to="/giveaway"><ArrowLeft size={15}/> <span>Giveaway Home</span></Link></div><GiveawayLoader/></div></main>;
 if(!prize||!event) return <main className={styles.page}><div className={styles.container}><div className={styles.emptyState}><span className={styles.kicker}>VELOOP REWARDS</span><h1>Reward not found</h1><p>This reward doesn't exist in the current giveaway catalogue.</p><Link to="/giveaway" className={styles.cta}>Back to Giveaways</Link></div></div></main>;

 const image=resolvePrizeImage(prize);
 const balances=currentUser?.balances||FALLBACK_BALANCES;
 const balance=balances[prize.entry.currency]??0;
 const enough=balance>=prize.entry.amount;
 const isWinner=status==='ended'&&(mode==='winner'||(myWin.won&&myWin.prize?.id===prize.id));
 const claimStatus=myClaim?.claim?.status||myClaim?.status||(mode==='winner'?'NOT_SUBMITTED':'NOT_SUBMITTED');

 const openJoin=()=>{
  if(!auth){window.location.href=`/login?redirect=/giveaway/${slug}`;return}
  if(status==='upcoming')return;
  if(status==='ended'){document.getElementById('winner-info')?.scrollIntoView({behavior:'smooth'});return}
  if(joined||!enough)return;
  setJoinError("");
  setConfirm(true);
 };
 const confirmJoin=async()=>{
  setJoinLoading(true);
  setJoinError("");
  try{
   await giveawayApi.join(event.id,prize.id);
   setConfirm(false);
   setSuccess(true);
   setParticipation((p)=>({joined:true,entries:(p.entries||0)+1,joinedPrizeIds:[...(p.joinedPrizeIds||[]),prize.id]}));
  }catch(err){
   setJoinError(err.message||"We couldn't record your participation. Please try again.");
  }finally{
   setJoinLoading(false);
  }
 };

 return <main className={styles.page}><div className={styles.container}>
  <div className={styles.detailNav}><Link to="/giveaway"><ArrowLeft size={15}/> <span className="desktopOnly">Giveaway Home</span><span className="mobileOnly">Giveaway</span></Link><span>REWARD DETAILS · {prize.id}</span></div>
  {mode!=='default'&&<div className={styles.demoBar}><Info size={14}/><span>Demo state: <b>{mode}</b>. This overlays the real fetched giveaway for QA/screenshot purposes.</span><button onClick={()=>setParams({})}>Reset</button></div>}
  <section className={styles.detailHero}><div className={styles.detailCopy}><div className={styles.badgeRow}><span className={styles.badge}>EXCLUSIVE GIVEAWAY</span><span className={status===GIVEAWAY_STATUS.ACTIVE?styles.liveBadge:styles.endedBadge}>{status==='active'?'● GIVEAWAY LIVE':status==='ended'?'● ENDED':'● STARTING SOON'}</span></div><h1>Win <em>{prize.name}</em></h1><p>{prize.description}</p><div className={styles.heroFacts}><span><Trophy size={15}/>{prize.winnerCount} winner{prize.winnerCount>1?'s':''}</span><span><Users size={15}/>{(prize.participants||0).toLocaleString()}+ participants</span><span><Coins size={15}/>{formatCurrency(prize.entry.amount,prize.entry.currency)} entry</span></div><div className={styles.statusLine}>{status==='upcoming'?<Countdown targetDate={event.nextStartAt||event.endAt} label="Starts in"/>:status==='active'?<Countdown targetDate={event.endAt}/>:<div className={styles.endedCopy}><Clock3 size={16}/> Giveaway ended — winner status follows finalization.</div>}</div></div><div className={styles.detailVisual}><div className={styles.visualGlow}/><img src={image} alt={prize.name}/><div className={styles.visualBadge}><Trophy size={13}/>{prize.winnerCount} winner{prize.winnerCount>1?'s':''}</div></div></section>

  <section className={styles.detailGrid}><article className={styles.detailCard}><div className={styles.sectionLabel}><span>ABOUT THE PRIZE</span><GiftIcon/></div><h2>{prize.name}</h2><p>{prize.description}</p><div className={styles.metricRow}><div><b>{prize.winnerCount}</b><span>Winner{prize.winnerCount>1?'s':''}</span></div><div><b>{(prize.participants||0).toLocaleString()}+</b><span>Participants</span></div><div><b>{prize.prizeType==='GIFT_CARD'?'Digital':'Physical'}</b><span>Fulfillment</span></div></div><ul className={styles.bulletList}><li><CheckCircle2 size={15}/> {prize.valueLabel}</li><li><CheckCircle2 size={15}/> {prize.fulfillment}</li><li><CheckCircle2 size={15}/> Claim fields depend on prize type.</li></ul></article>
   <article className={styles.entryCard}><span className={styles.kicker}>ENTRY REQUIREMENT</span><div className={styles.fee}>{prize.entry.amount.toLocaleString()} <small>{prize.entry.currency}</small></div><div className={styles.balanceBox}><div><span>Your balance</span><b>{formatCurrency(balance,prize.entry.currency)}</b></div><div><span>Required</span><b>{formatCurrency(prize.entry.amount,prize.entry.currency)}</b></div></div>{auth&&status==='active'&&!joined&&<div className={enough?styles.good:styles.bad}>{enough?<><CheckCircle2 size={15}/> You have enough {prize.entry.currency}</>:<>You need {(prize.entry.amount-balance).toLocaleString()} more {prize.entry.currency}</>}</div>}{joinError&&<div className={styles.bad}>{joinError}</div>}{joined?<div className={styles.joinedBox}><CheckCircle2 size={17}/><div><b>You're already participating</b><span>{participation.entries||1} entries recorded for this event.</span></div></div>:<button className={styles.ctaWide} onClick={openJoin} disabled={status==='active'&&!enough}>{status==='active'?(auth?(enough?`Join for ${formatCurrency(prize.entry.amount,prize.entry.currency)}`:`Earn More ${prize.entry.currency}`):'Login to Participate'):status==='ended'?'View Winner Information':'Notify Me'} <ArrowRight size={16}/></button>}<small className={styles.disclaimer}>The backend independently re-checks eligibility, balance, entry fee and giveaway status before accepting any real join.</small></article></section>

  {success&&<div className={styles.successPanel}><div className={styles.successIcon}><CheckCircle2 size={25}/></div><div><span className={styles.kicker}>PARTICIPATION RECORDED</span><h2>You're in.</h2><p>Your participation for <b>{prize.name}</b> has been recorded.</p></div><button onClick={()=>setSuccess(false)} aria-label="Dismiss"><X size={16}/></button></div>}

  {isWinner&&<section className={styles.winnerPanel} id="winner-info"><div className={styles.winnerHeader}><div className={styles.successIcon}><Trophy size={23}/></div><div><span className={styles.kicker}>CONGRATULATIONS</span><h2>You won {prize.name}.</h2><p>Winner ID <b>{currentUser?.displayId||'VE****DEMO'}</b> · Status <b>Winner ✓</b></p></div></div><div className={styles.winnerMeta}><div><span>Giveaway</span><b>{event.title}</b></div><div><span>Claim deadline</span><b>{myWin.claimDeadline?new Date(myWin.claimDeadline).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'7 days'}</b></div><div><span>Claim status</span><b>{claimStatus==='NOT_SUBMITTED'?'Not submitted':String(claimStatus).replace('_',' ')}</b></div></div><div className={styles.claimActions}><button className={styles.cta} onClick={()=>setClaimOpen(true)} disabled={claimStatus==='EXPIRED'||claimStatus==='COMPLETED'}>{claimStatus==='NOT_SUBMITTED'?'Claim Your Prize':claimStatus==='EXPIRED'?'Claim Window Expired':claimStatus==='COMPLETED'?'Prize Delivered ✓':'Claim Submitted ✓'} <ArrowRight size={16}/></button></div></section>}

  {status==='ended'&&(mode==='nonwinner'||(!isWinner&&mode==='default'&&joined))&&<section className={styles.nonWinner}><span className={styles.kicker}>THANK YOU FOR PARTICIPATING</span><h2>Didn't win this time?</h2><p>Keep exploring future rewards. This account has no matching winner record for this reward.</p><Link className={styles.cta} to="/giveaway">Explore next rewards <ArrowRight size={16}/></Link></section>}

  <section className={styles.detailSection}><div className={styles.sectionTop}><div><span className={styles.kicker}>THE FLOW</span><h2>How this giveaway works.</h2><p>Seven clear steps from discovery to prize fulfillment.</p></div></div><div className={styles.timeline}>{[['01','Review the reward'],['02','Check eligibility'],['03',`Confirm ${formatCurrency(prize.entry.amount,prize.entry.currency)}`],['04','Participation is recorded'],['05','Wait until the event ends'],['06','Winner is selected'],['07','Winner claims the prize']].map(([n,t])=><div key={n}><b>{n}</b><span>{t}</span></div>)}</div></section>

  <section className={styles.detailSection}><div className={styles.sectionTop}><div><span className={styles.kicker}>IMPORTANT INFORMATION</span><h2>Know the rules before joining.</h2></div></div><div className={styles.infoGrid}><InfoCard icon={Coins} title="Entry currency" text={formatCurrency(prize.entry.amount,prize.entry.currency)}/><InfoCard icon={Clock3} title="Giveaway duration" text={`${new Date(event.startAt).toLocaleDateString('en-IN')} → ${new Date(event.endAt).toLocaleDateString('en-IN')}`}/><InfoCard icon={Users} title="Participation" text={event.participationSettings?.oneParticipationPerUser?'One participation per user for this reward.':'Participation configuration applies.'}/><InfoCard icon={ShieldCheck} title="Eligibility" text={event.eligibility}/><InfoCard icon={Trophy} title="Winner selection" text="Finalized after the event ends according to the configured selection process."/><InfoCard icon={FileCheck} title="Claim requirements" text={prize.claimType==='EMAIL'?'Winner email for digital delivery.':'Name, phone and delivery address for physical fulfillment.'}/></div><details className={styles.details}><summary><CircleHelp size={17}/> Terms & Conditions <ArrowRight size={15}/></summary><div>{(event.rules||[]).map(r=><div key={r.title}><b>{r.title}</b><p>{r.text}</p></div>)}</div></details></section>

  {siblingPrizes.length>0&&<section className={styles.detailSection}><div className={styles.sectionTop}><div><span className={styles.kicker}>ABOUT THE REWARD</span><h2>Explore other prizes.</h2></div></div><div className={styles.relatedGrid}>{siblingPrizes.slice(0,3).map(p=><Link to={`/giveaway/${p.slug}`} className={styles.relatedCard} key={p.id}><img src={resolvePrizeImage(p)} alt={p.name}/><div><span>#{p.position}</span><h3>{p.name}</h3><p>{formatCurrency(p.entry.amount,p.entry.currency)}</p></div><ArrowRight size={16}/></Link>)}</div></section>}

  <section className={styles.footerTrust}><LockKeyhole size={18}/><div><b>Need help?</b><span>Contact VELOOP Rewards support. Sensitive fulfillment details are only ever submitted through the secure claim flow.</span></div></section>
  <footer className={styles.footer}><div className={styles.brand}><span>V</span><strong>VELOOP</strong><small>REWARDS</small></div><div><Link to="/giveaway">Giveaway Home</Link><a href="#rules">Rules</a><a href="#">Terms</a><a href="#">Privacy</a><a href="#">Support</a></div></footer>
 </div>
 {confirm&&<JoinConfirmation prize={prize} balance={balance} onClose={()=>!joinLoading&&setConfirm(false)} onConfirm={confirmJoin} loading={joinLoading}/>}
 {claimOpen&&<PrizeClaimModal prize={prize} winner={{...myWin,claimStatus}} giveawayId={event.id} onClose={()=>setClaimOpen(false)} onSubmitted={(res)=>setMyClaim({claim:res})}/>}
 </main>
}
function GiftIcon(){return <Gift/>} function InfoCard({icon:Icon,title,text}){return <article className={styles.infoCard}><div><Icon size={17}/></div><span>{title}</span><p>{text}</p></article>}
