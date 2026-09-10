import useCountdown from "../../hooks/useCountdown";
import styles from "./Countdown.module.css";
export default function Countdown({targetDate,label="Ends in",compact=false}){const {days,hours,minutes,seconds,expired}=useCountdown(targetDate);return <div className={`${styles.wrap} ${compact?styles.compact:""}`} aria-live="polite"><span>{expired?"Giveaway ended":label}</span>{!expired?<strong>{days}d <i>:</i> {String(hours).padStart(2,"0")}h <i>:</i> {String(minutes).padStart(2,"0")}m <i>:</i> {String(seconds).padStart(2,"0")}s</strong>:<strong>Winner announcement available</strong>}</div>}
