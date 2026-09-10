export const GIVEAWAY_STATUS={ACTIVE:"active",ENDED:"ended",UPCOMING:"upcoming",LOADING:"loading",ERROR:"error",EMPTY:"empty"};
export const DEMO_MODES={DEFAULT:"default",VISITOR:"visitor",PARTICIPANT:"participant",NEW_USER:"newuser",WINNER:"winner",NON_WINNER:"nonwinner",ENDED:"ended",UPCOMING:"upcoming",LOADING:"loading",ERROR:"error",EMPTY:"empty"};
export const STATUS_COPY={
 active:{badge:"Giveaway Live",description:"The giveaway is currently open for participation."},
 ended:{badge:"Giveaway Ended",description:"Winner information is available after finalization."},
 upcoming:{badge:"Starting Soon",description:"The next reward opportunity is getting ready."}
};
export function resolveParticipationCta({status,isAuthenticated=false,hasJoined=false}){
 if(status===GIVEAWAY_STATUS.UPCOMING)return{label:"Notify Me",action:"NOTIFY"};
 if(status===GIVEAWAY_STATUS.ENDED)return{label:"View Winners",action:"VIEW_WINNERS"};
 if(!isAuthenticated)return{label:"Login to Participate",action:"LOGIN"};
 if(hasJoined)return{label:"You're Participating ✓",action:"ALREADY_JOINED"};
 return{label:"Explore a Reward",action:"JOIN"};
}
export function formatCount(value,suffix=""){const n=Number(value);if(!Number.isFinite(n))return`0${suffix}`;if(n>=1e6)return`${Number.isInteger(n/1e6)?n/1e6:(n/1e6).toFixed(1)}M${suffix}`;if(n>=1000)return`${Number.isInteger(n/1000)?n/1000:(n/1000).toFixed(1)}K${suffix}`;return`${n}${suffix}`;}
export function formatCurrency(amount,currency){return`${Number(amount).toLocaleString("en-IN")} ${currency}`;}
