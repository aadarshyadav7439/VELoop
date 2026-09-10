import {ArrowRight,ChevronDown,RotateCcw} from "lucide-react";
import {useEffect,useMemo,useState,useCallback} from "react";
import {Link,useSearchParams} from "react-router-dom";
import GiveawayHero from "../../components/GiveawayHero/GiveawayHero";
import GiveawayStats from "../../components/GiveawayStats/GiveawayStats";
import PrizeCard from "../../components/PrizeCard/PrizeCard";
import WinnerSlider from "../../components/WinnerSlider/WinnerSlider";
import WinnersTabs from "../../components/WinnersTabs/WinnersTabs";
import HowToParticipate from "../../components/HowToParticipate/HowToParticipate";
import TrustSection from "../../components/TrustSection/TrustSection";
import GiveawayRules from "../../components/GiveawayRules/GiveawayRules";
import FAQ from "../../components/FAQ/FAQ";
import Countdown from "../../components/Countdown/Countdown";
import GiveawayLoader from "../../components/GiveawayLoader/GiveawayLoader";
import {giveawayApi} from "../../services/giveawayApi";
import {resolvePrizeImage,heroIllustrations} from "../../utils/prizeAssets";
import {DEMO_MODES,GIVEAWAY_STATUS,resolveParticipationCta} from "../../utils/giveawayStatus";
import useCountdown from "../../hooks/useCountdown";
import styles from "./Giveaway.module.css";

const FALLBACK_BALANCES = {VEs:850,SVEs:1200,Tokens:5000};

export default function GiveawayHome(){
 const [params,setParams]=useSearchParams();
 const requested=params.get('demo')||DEMO_MODES.DEFAULT;
 const demoMode=Object.values(DEMO_MODES).includes(requested)?requested:DEMO_MODES.DEFAULT;
 const [menuOpen,setMenuOpen]=useState(false);

 const [netState,setNetState]=useState('loading'); // loading | ready | error | empty
 const [event,setEvent]=useState(null);
 const [currentUser,setCurrentUser]=useState(null);
 const [participation,setParticipation]=useState({joined:false,entries:0,joinedPrizeIds:[]});
 const [winnersData,setWinnersData]=useState({finalized:false,winners:[]});
 const [previousGiveaways,setPreviousGiveaways]=useState([]);

 const load=useCallback(async()=>{
  setNetState('loading');
  try{
   const [giveaway,prev,me]=await Promise.all([
    giveawayApi.getCurrent(),
    giveawayApi.getPrevious().catch(()=>[]),
    giveawayApi.me().catch(()=>null)
   ]);
   setPreviousGiveaways(prev||[]);
   setCurrentUser(me);
   if(!giveaway){setEvent(null);setNetState('empty');return}
   setEvent(giveaway);
   if(me){
    const status=await giveawayApi.getMyStatus(giveaway.id).catch(()=>({joined:false,entries:0,joinedPrizeIds:[]}));
    setParticipation(status);
   }
   if(giveaway.status==='ended'){
    const winners=await giveawayApi.getWinners(giveaway.id).catch(()=>({finalized:false,winners:[]}));
    setWinnersData(winners);
   }
   setNetState('ready');
  }catch{
   setNetState('error');
  }
 },[]);

 useEffect(()=>{load()},[load]);

 const forcedState=[DEMO_MODES.LOADING,DEMO_MODES.ERROR,DEMO_MODES.EMPTY].includes(demoMode)?demoMode:null;
 const effectiveState=forcedState||netState;

 const countdown=useCountdown(event?.endAt||Date.now());
 const status=!event?null:demoMode===DEMO_MODES.UPCOMING?GIVEAWAY_STATUS.UPCOMING:([DEMO_MODES.ENDED,DEMO_MODES.WINNER,DEMO_MODES.NON_WINNER].includes(demoMode)||countdown.expired?GIVEAWAY_STATUS.ENDED:event.status==='upcoming'?GIVEAWAY_STATUS.UPCOMING:GIVEAWAY_STATUS.ACTIVE);
 const isAuth=demoMode==='visitor'?false:['newuser','participant','winner','nonwinner'].includes(demoMode)?true:Boolean(currentUser);
 const joined=demoMode==='participant'||demoMode==='winner'||(demoMode==='default'&&participation.joined);
 const cta=status?resolveParticipationCta({status,isAuthenticated:isAuth,hasJoined:joined}):null;
 const featured=useMemo(()=>event?event.prizes.filter(p=>p.featured):[],[event]);
 const announcements=useMemo(()=>{
  const pool=previousGiveaways[0]?.winners||winnersData.winners||[];
  return pool.slice(0,6).map((w,i)=>({id:`${w.userId}-${w.prizeId}-${i}`,displayId:w.displayId,prize:w.prizeName,message:`won ${w.prizeName}!`}));
 },[previousGiveaways,winnersData]);

 if(effectiveState==='loading'&&!forcedState) return <main className={styles.page}><div className={styles.container}><header className={styles.nav}><Link to="/giveaway" className={styles.brand}><span>V</span><strong>VELOOP</strong><small>REWARDS</small></Link></header><GiveawayLoader/></div></main>;
 if(effectiveState==='loading') return <StateDemo mode="loading" onReset={()=>setParams({})}/>;
 if(effectiveState==='error') return <StateDemo mode="error" onReset={()=>{setParams({});load()}}/>;
 if(effectiveState==='empty') return <StateDemo mode="empty" onReset={()=>setParams({})}/>;
 if(!event) return <StateDemo mode="empty" onReset={()=>setParams({})}/>;

 const balances=currentUser?.balances||FALLBACK_BALANCES;
 const displayId=currentUser?.displayId||'VE****DEMO';
 const action=()=>{if(cta.action==='LOGIN'){window.location.href='/login';return}if(cta.action==='VIEW_WINNERS'){document.getElementById('winners')?.scrollIntoView({behavior:'smooth'});return}if(cta.action==='NOTIFY'){setMenuOpen(false);return}window.location.href=`/giveaway/${featured[0]?.slug||event.prizes[0].slug}`};
 const viewUser={isAuthenticated:isAuth,displayId,participation:joined?{[event.id]:{joined:true}}:{}};
 const currentWinners=status===GIVEAWAY_STATUS.ENDED?winnersData.winners:[];
 const eventForChildren={...event,prizes:event.prizes.map(p=>({...p,image:resolvePrizeImage(p)})),status};
 const stateLabel=demoMode===DEMO_MODES.DEFAULT?'Auto':demoMode.replace('_',' ');
 return <main className={styles.page}><div className={styles.container}>
  <header className={styles.nav}><Link to="/giveaway" className={styles.brand}><span>V</span><strong>VELOOP</strong><small>REWARDS</small></Link><nav aria-label="Giveaway navigation"><a href="#prizes">Prizes</a><a href="#how">How it works</a><a href="#winners">Winners</a><a href="#rules">Rules</a><a href="#faq">FAQ</a></nav><div className={styles.navActions}><div className={styles.demoSelect}><button onClick={()=>setMenuOpen(v=>!v)} aria-expanded={menuOpen}><span>Demo: {stateLabel}</span><ChevronDown size={14}/></button>{menuOpen&&<div className={styles.demoMenu}>{Object.entries({default:'Auto (live backend)',loading:'Loading',error:'Error',empty:'Empty state',visitor:'Visitor',newuser:'Logged-in / not joined',participant:'Participant',winner:'Winner',nonwinner:'Non-winner',ended:'Ended',upcoming:'Upcoming'}).map(([key,label])=><button key={key} onClick={()=>{setParams(key==='default'?{}:{demo:key});setMenuOpen(false)}}>{label}{demoMode===key?' ✓':''}</button>)}</div>}</div><div className={styles.navBalance}>{isAuth?<><span>{balances.VEs?.toLocaleString()}</span> <b>VEs</b></>:<span>Guest</span>}</div>{!currentUser&&<Link to="/login" className={styles.demoSelect} style={{textDecoration:'none'}}><button>Login</button></Link>}{currentUser&&<button onClick={()=>{giveawayApi.logout();load()}} className={styles.demoSelect}>Logout</button>}</div></header>
  {demoMode!=='default'&&<div className={styles.demoBar}><RotateCcw size={14}/><span>Frontend demo state: <b>{stateLabel}</b>. Data is fictional and not live activity.</span><button onClick={()=>setParams({})}>Reset</button></div>}
  <GiveawayHero giveaway={eventForChildren} heroImage={heroIllustrations.giftBox} currentUser={viewUser} onPrimaryAction={action}/>
  <GiveawayStats stats={{totalGiveaways:event.totalGiveaways,participants:event.participants,prizesWon:event.prizesWon}} giveaway={eventForChildren}/>
  <WinnerSlider announcements={announcements}/>
  <section className={styles.featured} id="prizes"><div className={styles.sectionTop}><div><span className={styles.kicker}>FEATURED REWARDS</span><h2>Choose your chance to win.</h2><p>Every reward has its own currency, entry fee, winner count and fulfillment path.</p></div><div className={styles.eventTimer}><span>{status==='active'?'Event closes in':status==='ended'?'Event status':'Next giveaway'}</span>{status==='upcoming'?<Countdown targetDate={event.nextStartAt} label="Starts in"/>:<Countdown targetDate={event.endAt}/>}</div></div><div className={styles.prizeGrid}>{eventForChildren.prizes.filter(p=>p.featured).map(p=><PrizeCard key={p.id} prize={p} giveaway={eventForChildren}/>)}</div><div className={styles.moreHeading}><span>MORE REWARDS</span><p>Digital and smaller-value rewards.</p></div><div className={styles.moreGrid}>{eventForChildren.prizes.filter(p=>!p.featured).map(p=><PrizeCard key={p.id} prize={p} giveaway={eventForChildren}/>)}</div></section>
  <section id="how"><HowToParticipate/></section>
  <section className={styles.participation}><div className={styles.partCopy}><span className={styles.kicker}>YOUR PARTICIPATION</span><h2>{demoMode==='winner'?'Congratulations — you won.':joined?"You're already participating.":status==='ended'?'This event has closed.':status==='upcoming'?'Get ready for the next reward.':isAuth?'Ready to enter?':'Login to participate.'}</h2><p>{demoMode==='winner'?'Your winner-specific claim flow is available on the matching reward page.':joined?`You have ${participation.entries||1} entries in this event.`:status==='ended'?'Winners are shown below after finalization.':status==='upcoming'?'Explore the reward catalogue while you wait.':isAuth?'Review a prize first. The details page shows the exact cost before confirmation.':'Sign in before participating in a reward.'}</p></div><Link className={styles.cta} to={`/giveaway/${featured[0]?.slug||event.prizes[0].slug}`}>{status==='ended'?'View a Reward':joined?'View Your Reward':'Explore a Reward'} <ArrowRight size={16}/></Link></section>
  <WinnersTabs currentGiveaway={{...eventForChildren,winners:currentWinners}} previousGiveaways={previousGiveaways} ended={status===GIVEAWAY_STATUS.ENDED}/>
  <TrustSection/>
  <GiveawayRules rules={event.rules}/>
  <FAQ/>
  <section className={styles.finalCta}><div><span className={styles.kicker}>VELOOP REWARDS</span><h2>Reward experiences should feel clear.</h2><p>Know the prize. Know the cost. Know the rules. Then decide.</p></div><Link className={styles.cta} to={`/giveaway/${featured[0]?.slug||event.prizes[0].slug}`}>Explore iPhone giveaway <ArrowRight size={16}/></Link></section>
  <footer className={styles.footer}><div className={styles.brand}><span>V</span><strong>VELOOP</strong><small>REWARDS</small></div><p>Premium reward experiences built around clear rules and transparent participation.</p><div><a href="#prizes">Giveaways</a><a href="#winners">Winners</a><a href="#faq">Support</a><a href="#rules">Rules</a></div></footer>
 </div></main>
}

function StateDemo({mode,onReset}){if(mode==='loading')return <main className={styles.page}><div className={styles.container}><header className={styles.nav}><Link to="/giveaway" className={styles.brand}><span>V</span><strong>VELOOP</strong><small>REWARDS</small></Link></header><section className={styles.loadingGrid}><div className={styles.skeletonHero}/><div className={styles.skeletonStats}>{[1,2,3,4].map(i=><div key={i}/>)}</div><div className={styles.skeletonCards}>{[1,2,3].map(i=><div key={i}/>)}</div></section></div></main>;if(mode==='error')return <main className={styles.page}><div className={styles.container}><div className={styles.emptyState}><span className={styles.kicker}>VELOOP REWARDS</span><h1>We couldn't load the giveaway.</h1><p>Something interrupted the request. No raw API or JavaScript error is exposed to the user.</p><button className={styles.cta} onClick={onReset}>Try again <RotateCcw size={15}/></button></div></div></main>;return <main className={styles.page}><div className={styles.container}><div className={styles.emptyState}><span className={styles.kicker}>GIVEAWAY CATALOGUE</span><h1>No current giveaway</h1><p>The next giveaway is being prepared. Previous winners remain available in the reward history.</p><Link className={styles.cta} to="/giveaway?demo=upcoming">View upcoming state <ArrowRight size={15}/></Link></div></div></main>}
