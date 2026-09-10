import {Gift,PartyPopper,Users,Timer} from "lucide-react";
import Countdown from "../Countdown/Countdown";
import {formatCount} from "../../utils/giveawayStatus";
import styles from "./GiveawayStats.module.css";
export default function GiveawayStats({stats,giveaway}){const items=[{label:"Giveaways",value:formatCount(stats.totalGiveaways,"+"),icon:Gift},{label:"Participants",value:formatCount(stats.participants,"+"),icon:Users},{label:"Rewards distributed",value:formatCount(stats.prizesWon,"+"),icon:PartyPopper},{label:"Current event",value:null,icon:Timer}];return <section className={styles.grid} aria-label="Giveaway statistics">{items.map(({label,value,icon:Icon})=><article className={styles.card} key={label}><div className={styles.icon}><Icon size={19}/></div><div>{value?<strong>{value}</strong>:<Countdown targetDate={giveaway.endAt} compact/>}<span>{label}</span></div></article>)}</section>}
