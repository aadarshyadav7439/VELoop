import {useEffect,useMemo,useState} from "react";
export default function useCountdown(targetDate){
 const target=useMemo(()=>new Date(targetDate).getTime(),[targetDate]);
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const id=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(id)},[]);
 const diff=Math.max(0,target-now); const expired=diff<=0; const totalSeconds=Math.floor(diff/1000);
 return {days:Math.floor(totalSeconds/86400),hours:Math.floor((totalSeconds%86400)/3600),minutes:Math.floor((totalSeconds%3600)/60),seconds:totalSeconds%60,expired};
}
